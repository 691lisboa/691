export type BookingRecord = Record<string, any>
export type PushSubscriptionRecord = Record<string, any>

type StoreConfig = {
  url: string
  key: string
}

const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/$/, '')
const SUPABASE_SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '')
const supabase: StoreConfig | null = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? { url: SUPABASE_URL, key: SUPABASE_SERVICE_ROLE_KEY }
  : null

export const persistenceMode = supabase ? 'supabase' : 'unconfigured'

if (!supabase) {
  console.warn('Persistência não configurada: SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY em falta.')
}

async function supabaseRequest(pathname: string, init: RequestInit = {}): Promise<Response> {
  if (!supabase) throw new Error('Supabase persistence is not configured')

  const headers = new Headers(init.headers)

  headers.set('apikey', supabase.key)

  // Supabase's new `sb_secret_...` keys are opaque API keys, not JWTs.
  // They must be sent via the `apikey` header and must NOT be sent as
  // `Authorization: Bearer ...`, otherwise PostgREST attempts JWT parsing.
  if (!supabase.key.startsWith('sb_secret_')) {
    headers.set('Authorization', `Bearer ${supabase.key}`)
  } else {
    headers.delete('Authorization')
  }

  headers.set('Content-Type', 'application/json')
  headers.set('Accept', 'application/json')

  return fetch(`${supabase.url}/rest/v1/${pathname}`, {
    ...init,
    headers
  })
}

function supabaseError(operation: string, response: Response): Error {
  const statusText = response.statusText ? ` ${response.statusText}` : ''
  return new Error(`${operation} failed: HTTP ${response.status}${statusText}`)
}

function rowToBooking(row: Record<string, any>): BookingRecord {
  return {
    bookingId: row.booking_id,
    nome: row.nome,
    telefone: row.telefone,
    data: row.data,
    hora: String(row.hora || '').slice(0, 5),
    recolha: row.recolha,
    destino: row.destino,
    recolhaLat: row.recolha_lat ?? undefined,
    recolhaLon: row.recolha_lon ?? undefined,
    destinoLat: row.destino_lat ?? undefined,
    destinoLon: row.destino_lon ?? undefined,
    clientId: row.client_id,
    lang: row.lang || 'pt',
    status: row.status || 'pending',
    _telegramMessageId: row.telegram_message_id ?? undefined,
    _ts: row.created_at
      ? String(new Date(row.created_at).getTime())
      : String(Date.now()),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

let bookingCoordinatesSupported = true

function validCoordinate(value: unknown, min: number, max: number): number | null {
  const n = Number(value)
  return Number.isFinite(n) && n >= min && n <= max ? n : null
}

function bookingToRow(booking: BookingRecord, includeCoordinates = bookingCoordinatesSupported): Record<string, unknown> {
  const createdAt =
    booking.createdAt ||
    (
      Number(booking._ts) > 0
        ? new Date(Number(booking._ts)).toISOString()
        : new Date().toISOString()
    )

  const row: Record<string, unknown> = {
    booking_id: String(booking.bookingId),
    nome: String(booking.nome || ''),
    telefone: String(booking.telefone || ''),
    data: String(booking.data),
    hora: String(booking.hora),
    recolha: String(booking.recolha || ''),
    destino: String(booking.destino || ''),
    client_id: String(booking.clientId || ''),
    lang: String(booking.lang || 'pt'),
    status: String(booking.status || 'pending'),
    telegram_message_id: booking._telegramMessageId
      ? Number(booking._telegramMessageId)
      : null,
    created_at: createdAt,
    updated_at: new Date().toISOString()
  }

  if (includeCoordinates) {
    row.recolha_lat = validCoordinate(booking.recolhaLat, -90, 90)
    row.recolha_lon = validCoordinate(booking.recolhaLon, -180, 180)
    row.destino_lat = validCoordinate(booking.destinoLat, -90, 90)
    row.destino_lon = validCoordinate(booking.destinoLon, -180, 180)
  }

  return row
}

const lastPersistedStatus = new Map<string, string>()

export async function loadPersistentState(): Promise<{
  bookings: BookingRecord[]
  pushSubscriptions: Array<{
    clientId: string
    subscription: PushSubscriptionRecord
    endpoint: string
  }>
}> {
  if (!supabase) {
    return {
      bookings: [],
      pushSubscriptions: []
    }
  }

  const pushPromise = supabaseRequest(
    'push_subscriptions?select=client_id,endpoint,subscription&order=created_at.asc'
  )

  let bookingsResponse = await supabaseRequest(
    'bookings?select=booking_id,nome,telefone,data,hora,recolha,destino,recolha_lat,recolha_lon,destino_lat,destino_lon,client_id,lang,status,telegram_message_id,created_at,updated_at&order=created_at.asc'
  )

  // Backward-compatible deploy: the code can go live before the one-time SQL
  // migration is applied. After the migration, a restart enables persistence
  // of route coordinates automatically.
  if (!bookingsResponse.ok && bookingsResponse.status === 400) {
    bookingCoordinatesSupported = false
    console.warn('Supabase: colunas de coordenadas ainda não disponíveis; Waze mantém fallback por geocodificação até aplicar a migração final.')
    bookingsResponse = await supabaseRequest(
      'bookings?select=booking_id,nome,telefone,data,hora,recolha,destino,client_id,lang,status,telegram_message_id,created_at,updated_at&order=created_at.asc'
    )
  } else if (bookingsResponse.ok) {
    bookingCoordinatesSupported = true
  }

  const pushResponse = await pushPromise

  if (!bookingsResponse.ok || !pushResponse.ok) {
    const failures = [
      !bookingsResponse.ok
        ? supabaseError('Supabase bookings load', bookingsResponse)
        : null,
      !pushResponse.ok
        ? supabaseError('Supabase push subscriptions load', pushResponse)
        : null
    ].filter((error): error is Error => error !== null)

    throw new Error(
      failures.map(error => error.message).join(' | ')
    )
  }

  const bookingRows =
    await bookingsResponse.json() as Array<Record<string, any>>

  const pushRows =
    await pushResponse.json() as Array<Record<string, any>>

  const bookings = bookingRows.map(row => {
    const booking = rowToBooking(row)

    lastPersistedStatus.set(
      String(booking.bookingId),
      String(booking.status || 'pending')
    )

    return booking
  })

  const pushSubscriptions = pushRows.map(row => ({
    clientId: String(row.client_id),
    endpoint: String(row.endpoint),
    subscription: row.subscription as PushSubscriptionRecord
  }))

  return {
    bookings,
    pushSubscriptions
  }
}

export async function upsertBooking(booking: BookingRecord): Promise<void> {
  if (!supabase) return

  const status = String(booking.status || 'pending')
  const previousStatus = lastPersistedStatus.get(
    String(booking.bookingId)
  )

  let response = await supabaseRequest(
    'bookings?on_conflict=booking_id',
    {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify(bookingToRow(booking))
    }
  )

  // Same safe fallback as loadPersistentState for deployments where the final
  // coordinate migration has not yet been applied.
  if (!response.ok && response.status === 400 && bookingCoordinatesSupported) {
    bookingCoordinatesSupported = false
    response = await supabaseRequest(
      'bookings?on_conflict=booking_id',
      {
        method: 'POST',
        headers: {
          Prefer: 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify(bookingToRow(booking, false))
      }
    )
  }

  if (!response.ok) {
    throw supabaseError('Supabase booking upsert', response)
  }

  if (previousStatus !== status) {
    const eventResponse = await supabaseRequest(
      'booking_events',
      {
        method: 'POST',
        headers: {
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({
          booking_id: String(booking.bookingId),
          status,
          message: null
        })
      }
    )

    if (!eventResponse.ok) {
      console.warn(
        supabaseError(
          'Supabase booking event',
          eventResponse
        ).message
      )
    }

    lastPersistedStatus.set(
      String(booking.bookingId),
      status
    )
  }
}

export async function deleteBooking(bookingId: string): Promise<void> {
  if (!supabase) return

  const response = await supabaseRequest(
    `bookings?booking_id=eq.${encodeURIComponent(bookingId)}`,
    {
      method: 'DELETE'
    }
  )

  if (!response.ok) {
    throw supabaseError('Supabase booking delete', response)
  }

  lastPersistedStatus.delete(String(bookingId))
}

export async function upsertPushSubscription(
  clientId: string,
  subscription: PushSubscriptionRecord
): Promise<void> {
  if (!supabase) return

  const endpoint = String(
    (subscription as any)?.endpoint || ''
  )

  if (!endpoint) {
    throw new Error('Push subscription sem endpoint')
  }

  // A browser push endpoint must belong to a single clientId. If local storage was
  // reset while the browser kept the same PushSubscription, remove the stale owner
  // first so the endpoint unique constraint cannot break re-registration.
  const endpointCleanup = await supabaseRequest(
    `push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}&client_id=neq.${encodeURIComponent(clientId)}`,
    { method: 'DELETE' }
  )
  if (!endpointCleanup.ok) {
    throw supabaseError('Supabase stale push endpoint cleanup', endpointCleanup)
  }

  const response = await supabaseRequest(
    'push_subscriptions?on_conflict=client_id',
    {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify({
        client_id: clientId,
        endpoint,
        subscription,
        updated_at: new Date().toISOString()
      })
    }
  )

  if (!response.ok) {
    throw supabaseError(
      'Supabase push upsert',
      response
    )
  }
}

export async function deletePushSubscription(
  clientId: string
): Promise<void> {
  if (!supabase) return

  const response = await supabaseRequest(
    `push_subscriptions?client_id=eq.${encodeURIComponent(clientId)}`,
    {
      method: 'DELETE'
    }
  )

  if (!response.ok) {
    throw supabaseError(
      'Supabase push delete',
      response
    )
  }
}

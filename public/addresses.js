// Base de dados completa - Lisboa, Sintra, Cascais e arredores
// Hotéis, restaurantes, POIs com números e moradas completas
const portugalAddresses = {
    /* ===================== AEROPORTOS & TRANSPORTES ===================== */
    transportes: [
        "Aeroporto Humberto Delgado - Alameda das Comunidades Portuguesas, Lisboa",
        "Terminal 1 Aeroporto Lisboa - Alameda das Comunidades Portuguesas, Lisboa",
        "Terminal 2 Aeroporto Lisboa - Alameda das Comunidades Portuguesas, Lisboa",
        "Estação Gare do Oriente - Avenida Dom João II, Lisboa",
        "Estação Santa Apolónia - Avenida Infante Dom Henrique, Lisboa",
        "Estação Cais do Sodré - Praça Duque da Terceira, Lisboa",
        "Estação Rossio - Praça Dom Pedro IV, Lisboa",
        "Estação Entrecampos - Rua Engenheiro Vieira da Silva, Lisboa",
        "Estação Sete Rios - Rua de Entrecampos, Lisboa",
        "Terminal de Cruzeiros Alcântara - Cais de Alcântara, Lisboa",
        "Terminal de Cruzeiros Santa Apolónia - Av. Infante Dom Henrique, Lisboa",
        "Estação de Cascais - Largo da Estação 1, Cascais",
        "Estação de Estoril - Av. de Nice, Estoril",
        "Estação de Sintra - Largo do Dr. Virgílio Horta, Sintra",
        "Estação de Oeiras - Rua Jacinto Nunes, Oeiras",
        "Estação de Belém - Calçada do Galvão, Lisboa",
        "Rede Expressos - Sete Rios - Praça Marechal Humberto Delgado, Lisboa",
    ],

    /* ===================== HOTÉIS LISBOA ===================== */
    hoteisLisboa: [
        "Four Seasons Hotel Ritz Lisboa - Rua Rodrigo da Fonseca 88, Lisboa",
        "Bairro Alto Hotel - Praça Luís de Camões 2, Lisboa",
        "Tivoli Avenida Liberdade Lisboa - Avenida da Liberdade 185, Lisboa",
        "Hotel Avenida Palace - Rua 1º de Dezembro 123, Lisboa",
        "Corinthia Hotel Lisboa - Avenida Columbano Bordalo Pinheiro 105, Lisboa",
        "Sofitel Lisboa Liberdade - Avenida da Liberdade 127, Lisboa",
        "InterContinental Lisboa - Rua Castilho 149, Lisboa",
        "Olissippo Lapa Palace - Rua do Pau da Bandeira 4, Lisboa",
        "Palácio do Governador Hotel - Calçada do Galvão 10, Lisboa",
        "Memmo Alfama Design Hotel - Travessa das Merceeiras 27, Lisboa",
        "Solar do Castelo - Rua das Cozinhas 2, Lisboa",
        "The Independente Hostel & Suites - Rua de São Pedro de Alcântara 81, Lisboa",
        "Martinhal Lisbon Chiado - Rua das Flores 44, Lisboa",
        "As Janelas Verdes - Rua das Janelas Verdes 47, Lisboa",
        "Hotel Britânia - Rua Rodrigues Sampaio 17, Lisboa",
        "Lisboa Pessoa Hotel - Rua Luciano Cordeiro 38, Lisboa",
        "Turim Baixa Hotel - Rua da Vitória 53, Lisboa",
        "Turim Lisboa Hotel - Avenida da Liberdade 180, Lisboa",
        "Brown's Central Hotel - Avenida da Liberdade 8, Lisboa",
        "Vincci Baixa Hotel - Rua do Crucifixo 40, Lisboa",
        "Hotel Heritage Av. Liberdade - Avenida da Liberdade 28, Lisboa",
        "Inn Rossio Hotel - Calçada do Carmo 13, Lisboa",
        "Hotel Borges Chiado - Rua Garrett 108, Lisboa",
        "Chiado Suites - Rua do Carmo 7, Lisboa",
        "LX Boutique Hotel - Rua do Alecrim 12, Lisboa",
        "Flórida Hotel - Rua Duque de Palmela 32, Lisboa",
        "Hotel Dom Carlos Liberty - Avenida Duque de Ávila 90, Lisboa",
        "VIP Grand Lisboa Hotel - Avenida Afonso III 1, Lisboa",
        "Sana Lisboa Hotel - Avenida Fontes Pereira de Melo 11, Lisboa",
        "DoubleTree by Hilton Lisboa - Rua Castilho 61, Lisboa",
        "Altis Grand Hotel - Rua Castilho 11, Lisboa",
        "Altis Belém Hotel & Spa - Doca do Bom Sucesso, Lisboa",
        "Palácio Belmonte - Pátio Dom Fradique 14, Lisboa",
        "Torel Palace Lisboa - Rua João Pereira da Rosa 1, Lisboa",
        "Torel Avantgarde - Rua Saraiva de Carvalho 114, Lisboa",
        "NH Lisboa Liberdade - Avenida da Liberdade 180, Lisboa",
        "Hotel Mundial Lisboa - Praça Martim Moniz 2, Lisboa",
        "Eurostars Book Hotel - Rua do Duque 25, Lisboa",
        "Ibis Lisboa Liberdade - Rua Barata Salgueiro 53, Lisboa",
        "Novotel Lisboa - Rua Artur Lamas 7, Lisboa",
        "Sheraton Lisboa Hotel - Rua Latino Coelho 1, Lisboa",
        "Real Palácio Hotel Lisboa - Rua Tomás Ribeiro 115, Lisboa",
        "Inspira Santa Marta Hotel - Rua de Santa Marta 48, Lisboa",
        "Hotel da Estrela - Rua Saraiva de Carvalho 35, Lisboa",
        "Casa Balthazar Chiado - Rua do Duque 26, Lisboa",
        "Santiago de Alfama Boutique Hotel - Rua de Santiago 10, Lisboa",
        "The Lince Lisboa - Avenida José Malhoa 1, Lisboa",
        "Epic Sana Lisboa Hotel - Avenida Engenheiro Duarte Pacheco 15, Lisboa",
        "Hotel Presidente Lisboa - Rua Alexandre Herculano 13, Lisboa",
        "HF Fenix Lisboa - Praça Marquês de Pombal 8, Lisboa",
        "Holiday Inn Express Lisboa Av. Liberdade - Rua Alexandre Herculano 7, Lisboa",
    ],

    /* ===================== HOTÉIS CASCAIS & ESTORIL ===================== */
    hoteisCascaisEstoril: [
        "Hotel Palácio Estoril Golf & Wellness - Rua Particular, Estoril",
        "Hotel Albatroz - Rua Frederico Arouca 100, Cascais",
        "Farol Hotel - Avenida Rei Humberto II de Itália 7, Cascais",
        "Casa da Pérgola - Avenida Valbom 13, Cascais",
        "Villa Cascais Guesthouse - Rua da Misericórdia 3, Cascais",
        "Bairro dos Duques Cascais - Rua Afonso Sanches 61, Cascais",
        "Cascais Miragem Health & Spa - Avenida Marginal 8554, Cascais",
        "Hotel Pestana Cidadela Cascais - Avenida Dom Carlos I 2, Cascais",
        "Hotel Vila Galé Cascais - Rua Padre Moisés da Silva, Cascais",
        "Hotel Tamariz - Avenida Marginal, Estoril",
        "Hotel Inglaterra Estoril - Rua do Porto 1, Estoril",
        "Hotel Estoril Eden - Avenida de Nice 4, Estoril",
    ],

    /* ===================== HOTÉIS SINTRA ===================== */
    hoteisSintra: [
        "Tivoli Palácio de Seteais - Rua Barbosa du Bocage 8, Sintra",
        "Penha Longa Resort - Estrada da Lagoa Azul, Sintra",
        "Chalet Relogio - Rua do Matadouro 16, Sintra",
        "Lawrence's Hotel - Rua Consiglieri Pedroso 38, Sintra",
        "Quinta Verde Sintra - Estrada de Colares 1047, Sintra",
        "Hotel Tivoli Sintra - Praça da República, Sintra",
        "Sintra Boutique Hotel - Rua Visconde de Monserrate 16, Sintra",
        "Casa Miradouro - Rua Sotto Mayor 55, Sintra",
    ],

    /* ===================== RESTAURANTES LISBOA ===================== */
    restaurantesLisboa: [
        "Belcanto (2 estrelas Michelin) - Largo de São Carlos 10, Lisboa",
        "100 Maneiras - Rua do Teixeira 35, Lisboa",
        "Eleven Restaurant - Rua Marquês da Fronteira, Jardim Amália Rodrigues, Lisboa",
        "Time Out Market Lisboa - Avenida 24 de Julho 49, Lisboa",
        "Solar dos Presuntos - Rua das Portas de Santo Antão 150, Lisboa",
        "A Cevicheria - Rua Dom Pedro V 129, Lisboa",
        "Sea Me Peixaria Moderna - Rua do Loreto 21, Lisboa",
        "Taberna da Rua das Flores - Rua das Flores 103, Lisboa",
        "Tasca do Chico - Rua do Diário de Notícias 39, Lisboa",
        "Zé da Mouraria - Rua João do Outeiro 24, Lisboa",
        "Prado Restaurante - Travessa das Pedras Negras 2, Lisboa",
        "Pharmacia Restaurante - Rua Marechal Saldanha 1, Lisboa",
        "Vela Latina - Doca do Bom Sucesso, Lisboa",
        "Tágide Restaurante - Largo da Academia Nacional de Belas Artes 18, Lisboa",
        "Sancho Restaurante - Travessa da Glória 14, Lisboa",
        "O Policia - Rua Marquês Sá da Bandeira 112, Lisboa",
        "Tasca do Oliveira - Rua do Grémio Lusitano 9, Lisboa",
        "Tasca Zé dos Cornos - Rua do Grémio Lusitano 3, Lisboa",
        "A Travessa Restaurante - Travessa do Convento das Bernardas 12, Lisboa",
        "Cervejaria Ramiro - Avenida Almirante Reis 1, Lisboa",
        "Cervejaria Portugália - Avenida Almirante Reis 117, Lisboa",
        "Casa de Fados o Forcado - Rua da Rosa 221, Lisboa",
        "Fado ao Centro - Rua do Correio Velho 4, Lisboa",
        "Adega Machado - Rua do Norte 91, Lisboa",
        "Palácio Chiado - Rua do Alecrim 70, Lisboa",
        "Cantinho do Avillez - Rua dos Duques de Bragança 7, Lisboa",
        "Mini Bar Teatro - Rua António Maria Cardoso 58, Lisboa",
        "Bica do Sapato - Avenida Infante Dom Henrique, Lisboa",
        "Último Porto - Doca de Santo Amaro, Lisboa",
        "Noobai Café - Miradouro de Santa Catarina, Lisboa",
        "Sky Bar Tivoli - Avenida da Liberdade 185, Lisboa",
        "Park Bar - Calçada do Combro 58, Lisboa",
    ],

    /* ===================== RESTAURANTES CASCAIS & SINTRA ===================== */
    restaurantesCascaisSintra: [
        "Restaurante Fortaleza do Guincho - Estrada do Guincho, Cascais",
        "Restaurante Furnas do Guincho - Estrada do Guincho, Cascais",
        "Restaurante Jardim dos Frades - Quinta da Marinha, Cascais",
        "Restaurante Monte Mar - Rua das Flores 2, Cascais",
        "Restaurante O Pescador - Rua das Flores 10, Cascais",
        "Restaurante Beira Mar - Largo das Bicas 6, Cascais",
        "Tasca de Diogo - Rua de Palmela 18, Cascais",
        "Restaurante Jacob - Avenida do Sabóia 9, Monte Estoril",
        "Restaurante Inácio - Rua da Padaria 7, Sintra",
        "Restaurante Tascantiga - Rua Arco do Teixeira 15, Sintra",
        "Restaurante Tulhas - Rua Gil Vicente 4, Sintra",
    ],

    /* ===================== PONTOS DE INTERESSE LISBOA ===================== */
    poisLisboa: [
        "Mosteiro dos Jerónimos - Praça do Império, Belém, Lisboa",
        "Torre de Belém - Avenida de Brasília, Lisboa",
        "Castelo de São Jorge - Rua de Santa Cruz do Castelo, Lisboa",
        "Museu Nacional do Azulejo - Rua da Madre de Deus 4, Lisboa",
        "Museu Calouste Gulbenkian - Avenida de Berna 45A, Lisboa",
        "Museu Nacional de Arte Antiga - Rua das Janelas Verdes 9, Lisboa",
        "Museu do Oriente - Avenida Brasília, Lisboa",
        "Oceanário de Lisboa - Esplanada Dom Carlos I, Parque das Nações, Lisboa",
        "Pavilhão de Portugal - Alameda dos Oceanos, Parque das Nações, Lisboa",
        "Altice Arena - Rossio dos Olivais, Parque das Nações, Lisboa",
        "Torre Vasco da Gama - Cais das Naus, Parque das Nações, Lisboa",
        "Padrão dos Descobrimentos - Avenida de Brasília, Lisboa",
        "Palácio Nacional de Queluz - Largo do Palácio Nacional, Queluz",
        "Palácio Nacional de Mafra - Terreiro Dom João V, Mafra",
        "Palácio da Ajuda - Largo da Ajuda, Lisboa",
        "Parque Eduardo VII - Parque Eduardo VII, Lisboa",
        "Jardim da Estrela - Praça da Estrela, Lisboa",
        "Jardim Botânico de Lisboa - Rua da Escola Politécnica 58, Lisboa",
        "Fundação Arpad Szenes-Vieira da Silva - Praça das Amoreiras 56, Lisboa",
        "Museu do Design e da Moda (MUDE) - Rua Augusta 24, Lisboa",
        "Museu Nacional do Teatro - Estrada do Lumiar 10, Lisboa",
        "LxFactory - Rua Rodrigues de Faria 103, Lisboa",
        "Feira da Ladra - Campo de Santa Clara, Lisboa",
        "Miradouro da Graça - Largo da Graça, Lisboa",
        "Miradouro de Santa Luzia - Largo de Santa Luzia, Lisboa",
        "Miradouro das Portas do Sol - Largo das Portas do Sol, Lisboa",
        "Miradouro da Senhora do Monte - Rua da Senhora do Monte, Lisboa",
        "Miradouro de São Pedro de Alcântara - Rua São Pedro de Alcântara, Lisboa",
        "Elevador de Santa Justa - Rua do Ouro, Lisboa",
        "Elevador da Glória - Calçada da Glória, Lisboa",
        "Elevador da Bica - Rua de São Paulo, Lisboa",
        "Praça do Comércio - Praça do Comércio, Lisboa",
        "Praça do Rossio - Praça Dom Pedro IV, Lisboa",
        "Praça Marquês de Pombal - Praça Marquês de Pombal, Lisboa",
        "Largo do Chiado - Largo do Chiado, Lisboa",
        "Sé de Lisboa - Largo da Sé, Lisboa",
        "Igreja de São Vicente de Fora - Largo de São Vicente, Lisboa",
        "Panteão Nacional - Campo de Santa Clara, Lisboa",
        "Basílica da Estrela - Praça da Estrela, Lisboa",
        "Igreja do Carmo - Largo do Carmo, Lisboa",
        "Estádio do Sport Lisboa e Benfica - Avenida General Norton de Matos, Lisboa",
        "Estádio Alvalade - Rua Prof. Fernando da Fonseca, Lisboa",
        "Ponte 25 de Abril - Ponte 25 de Abril, Lisboa",
        "Ponte Vasco da Gama - Ponte Vasco da Gama, Lisboa",
        "Centro Cultural de Belém - Praça do Império, Lisboa",
        "Fundação Champalimaud - Avenida Brasília, Lisboa",
        "MNAC Museu do Chiado - Rua Serpa Pinto 4, Lisboa",
        "Centro Comercial Colombo - Avenida Lusíada, Lisboa",
        "Centro Comercial Vasco da Gama - Av. Dom João II, Parque das Nações, Lisboa",
        "El Corte Inglés Lisboa - Avenida António Augusto de Aguiar 31, Lisboa",
        "Amoreiras Shopping Center - Avenida Engenheiro Duarte Pacheco, Lisboa",
    ],

    /* ===================== PONTOS DE INTERESSE SINTRA ===================== */
    poisSintra: [
        "Palácio Nacional da Pena - Estrada da Pena, Sintra",
        "Castelo dos Mouros - Estrada do Castelo dos Mouros, Sintra",
        "Palácio Nacional de Sintra - Largo Rainha Dona Amélia 1, Sintra",
        "Quinta da Regaleira - Rua Barbosa du Bocage 5, Sintra",
        "Palácio de Monserrate - Estrada de Monserrate, Sintra",
        "Palácio Nacional de Queluz - Largo do Palácio Nacional, Queluz, Sintra",
        "Convento dos Capuchos - Estrada dos Capuchos, Sintra",
        "Quinta do Monte da Lua - Estrada de São João, Sintra",
        "Centro Histórico de Sintra - Rua das Padarias, Sintra",
        "Parque e Palácio da Pena - Estrada da Pena, Sintra",
        "Praia da Ursa - Cabo da Roca, Sintra",
        "Cabo da Roca - Estrada do Cabo da Roca, Sintra",
        "Praia Grande - Rua da Praia Grande, Colares, Sintra",
        "Praia das Maçãs - Avenida Eugénio Levy, Colares, Sintra",
        "Praia de Azenhas do Mar - Azenhas do Mar, Sintra",
        "Adega Regional de Colares - Alameda Coronel Linhares de Lima 1, Colares, Sintra",
    ],

    /* ===================== PONTOS DE INTERESSE CASCAIS & ESTORIL ===================== */
    poisCascaisEstoril: [
        "Cascais Marina - Avenida Dom Carlos I, Cascais",
        "Boca do Inferno - Estrada da Boca do Inferno, Cascais",
        "Praia de Cascais - Avenida Dom Carlos I, Cascais",
        "Praia do Guincho - Estrada do Guincho, Cascais",
        "Praia da Rainha - Avenida Dom Carlos I, Cascais",
        "Praia da Ribeira - Largo da Ribeira, Cascais",
        "Fortaleza de Cascais - Avenida Dom Carlos I, Cascais",
        "Museu da Vila Condal - Avenida Rei Humberto II de Itália 2, Cascais",
        "Museu do Mar Rei D. Carlos - Rua Júlio Pereira de Mello, Cascais",
        "Centro Cultural de Cascais - Av. Rei Humberto II de Itália 4, Cascais",
        "Casino Estoril - Av. Dr. Stanley Ho, Estoril",
        "Parque do Estoril - Avenida de Nice, Estoril",
        "Praia do Estoril - Av. Marginal, Estoril",
        "Praia da Poça - Av. Clotilde, Estoril",
        "Golf do Estoril - Av. da República, Estoril",
        "Quinta da Marinha - Estrada de Birre, Cascais",
        "Centro Comercial Cascais Shopping - Rua Afonso Sanches, Cascais",
    ],

    /* ===================== MORADAS PRINCIPAIS LISBOA ===================== */
    moradasLisboa: [
        "Avenida da Liberdade 1, Lisboa",
        "Avenida da Liberdade 50, Lisboa",
        "Avenida da Liberdade 100, Lisboa",
        "Avenida da Liberdade 150, Lisboa",
        "Avenida da Liberdade 185, Lisboa",
        "Avenida da Liberdade 200, Lisboa",
        "Avenida da Liberdade 250, Lisboa",
        "Avenida Almirante Reis 1, Lisboa",
        "Avenida Almirante Reis 50, Lisboa",
        "Avenida Almirante Reis 100, Lisboa",
        "Avenida Almirante Reis 150, Lisboa",
        "Avenida Almirante Reis 200, Lisboa",
        "Avenida de Roma 10, Lisboa",
        "Avenida de Roma 50, Lisboa",
        "Avenida de Roma 100, Lisboa",
        "Avenida de Roma 150, Lisboa",
        "Avenida 24 de Julho 1, Lisboa",
        "Avenida 24 de Julho 49, Lisboa",
        "Avenida 24 de Julho 100, Lisboa",
        "Avenida Fontes Pereira de Melo 10, Lisboa",
        "Avenida Fontes Pereira de Melo 50, Lisboa",
        "Avenida da República 10, Lisboa",
        "Avenida da República 50, Lisboa",
        "Avenida da República 100, Lisboa",
        "Avenida Eng. Duarte Pacheco 1, Lisboa",
        "Avenida Eng. Duarte Pacheco 15, Lisboa",
        "Avenida Columbano Bordalo Pinheiro 50, Lisboa",
        "Avenida Columbano Bordalo Pinheiro 105, Lisboa",
        "Avenida José Malhoa 1, Lisboa",
        "Avenida José Malhoa 50, Lisboa",
        "Avenida de Berna 10, Lisboa",
        "Avenida de Berna 45, Lisboa",
        "Rua Augusta 1, Lisboa",
        "Rua Augusta 25, Lisboa",
        "Rua Augusta 50, Lisboa",
        "Rua Augusta 100, Lisboa",
        "Rua Augusta 150, Lisboa",
        "Rua Garrett 1, Lisboa",
        "Rua Garrett 25, Lisboa",
        "Rua Garrett 50, Lisboa",
        "Rua Garrett 108, Lisboa",
        "Rua do Carmo 1, Lisboa",
        "Rua do Carmo 25, Lisboa",
        "Rua do Carmo 50, Lisboa",
        "Rua do Alecrim 1, Lisboa",
        "Rua do Alecrim 25, Lisboa",
        "Rua do Alecrim 50, Lisboa",
        "Rua do Alecrim 70, Lisboa",
        "Rua de Belém 10, Lisboa",
        "Rua de Belém 50, Lisboa",
        "Rua de Belém 100, Lisboa",
        "Rua da Junqueira 10, Lisboa",
        "Rua da Junqueira 50, Lisboa",
        "Rua da Junqueira 100, Lisboa",
        "Rua das Janelas Verdes 1, Lisboa",
        "Rua das Janelas Verdes 25, Lisboa",
        "Rua das Janelas Verdes 47, Lisboa",
        "Rua Castilho 1, Lisboa",
        "Rua Castilho 50, Lisboa",
        "Rua Castilho 100, Lisboa",
        "Rua Castilho 149, Lisboa",
        "Rua Rodrigo da Fonseca 1, Lisboa",
        "Rua Rodrigo da Fonseca 50, Lisboa",
        "Rua Rodrigo da Fonseca 88, Lisboa",
        "Rua Alexandre Herculano 1, Lisboa",
        "Rua Alexandre Herculano 50, Lisboa",
        "Rua Tomás Ribeiro 1, Lisboa",
        "Rua Tomás Ribeiro 50, Lisboa",
        "Rua Saraiva de Carvalho 1, Lisboa",
        "Rua Saraiva de Carvalho 50, Lisboa",
        "Rua Dom Pedro V 1, Lisboa",
        "Rua Dom Pedro V 50, Lisboa",
        "Rua Dom Pedro V 100, Lisboa",
        "Rua Dom Pedro V 129, Lisboa",
        "Rua da Rosa 1, Lisboa",
        "Rua da Rosa 100, Lisboa",
        "Rua da Rosa 221, Lisboa",
        "Rua das Flores 1, Lisboa",
        "Rua das Flores 50, Lisboa",
        "Rua das Flores 100, Lisboa",
        "Rua das Portas de Santo Antão 10, Lisboa",
        "Rua das Portas de Santo Antão 100, Lisboa",
        "Rua das Portas de Santo Antão 150, Lisboa",
        "Rua de São Bento 1, Lisboa",
        "Rua de São Bento 50, Lisboa",
        "Rua de São Bento 100, Lisboa",
        "Rua de São Bento 200, Lisboa",
        "Calçada do Carmo 1, Lisboa",
        "Calçada do Carmo 25, Lisboa",
        "Calçada do Carmo 50, Lisboa",
        "Largo do Chiado 1, Lisboa",
        "Largo do Chiado 5, Lisboa",
        "Rua de Santa Catarina 1, Lisboa",
        "Rua de Santa Catarina 25, Lisboa",
        "Travessa da Glória 5, Lisboa",
        "Travessa das Pedras Negras 2, Lisboa",
        "Travessa do Carmo 1, Lisboa",
    ],

    /* ===================== MORADAS CASCAIS ===================== */
    moradasCascais: [
        "Rua Frederico Arouca 1, Cascais",
        "Rua Frederico Arouca 50, Cascais",
        "Rua Frederico Arouca 100, Cascais",
        "Avenida Dom Carlos I 1, Cascais",
        "Avenida Dom Carlos I 50, Cascais",
        "Avenida Dom Carlos I 100, Cascais",
        "Avenida Valbom 1, Cascais",
        "Avenida Valbom 50, Cascais",
        "Largo Luís de Camões 1, Cascais",
        "Largo Luís de Camões 5, Cascais",
        "Rua de Palmela 1, Cascais",
        "Rua de Palmela 25, Cascais",
        "Avenida Marginal 8500, Cascais",
        "Avenida Marginal 8550, Cascais",
        "Avenida Marginal 8600, Cascais",
        "Avenida Marginal 9, Estoril",
        "Avenida Marginal 50, Estoril",
        "Rua de Lisboa 1, Estoril",
        "Rua de Lisboa 25, Estoril",
        "Avenida de Nice 1, Estoril",
        "Avenida de Nice 25, Estoril",
    ],

    /* ===================== MORADAS SINTRA ===================== */
    moradasSintra: [
        "Rua Consiglieri Pedroso 1, Sintra",
        "Rua Consiglieri Pedroso 25, Sintra",
        "Rua Consiglieri Pedroso 50, Sintra",
        "Rua Barbosa du Bocage 1, Sintra",
        "Rua Barbosa du Bocage 5, Sintra",
        "Rua Barbosa du Bocage 25, Sintra",
        "Rua das Padarias 1, Sintra",
        "Rua das Padarias 10, Sintra",
        "Largo Rainha Dona Amélia 1, Sintra",
        "Rua Gil Vicente 1, Sintra",
        "Rua Gil Vicente 25, Sintra",
        "Estrada de Colares 1, Sintra",
        "Estrada de Colares 100, Sintra",
        "Rua da Padaria 1, Sintra",
        "Avenida Heliodoro Salgado 1, Sintra",
        "Avenida Heliodoro Salgado 50, Sintra",
    ],

    /* ===================== HOSPITAIS ===================== */
    hospitais: [
        "Hospital de Santa Maria - Avenida Professor Egas Moniz, Lisboa",
        "Hospital de São José - Rua José António Serrano, Lisboa",
        "Hospital Curry Cabral - Rua da Beneficência 8, Lisboa",
        "Hospital de Dona Estefânia - Rua Jacinta Marto 8, Lisboa",
        "Hospital de Santa Marta - Rua de Santa Marta 50, Lisboa",
        "Hospital da Luz Lisboa - Avenida Lusíada 100, Lisboa",
        "Hospital CUF Descobertas - Rua Mário Botas, Parque das Nações, Lisboa",
        "Hospital CUF Infante Santo - Travessa do Castro 3, Lisboa",
        "Hospital Particular de Lisboa - Rua do Patrocínio 37, Lisboa",
        "Hospital de Cascais Dr. José de Almeida - Avenida Brigadeiro Victor Novais Gonçalves, Cascais",
        "Clínica CUF Cascais - Rua Frei Nicolau de Oliveira, Cascais",
    ],

    /* ===================== UNIVERSIDADES ===================== */
    universidades: [
        "Universidade de Lisboa - Alameda da Universidade, Lisboa",
        "Instituto Superior Técnico - Avenida Rovisco Pais 1, Lisboa",
        "Faculdade de Ciências de Lisboa - Campo Grande 016, Lisboa",
        "Faculdade de Direito de Lisboa - Alameda da Universidade, Lisboa",
        "Faculdade de Medicina de Lisboa - Avenida Professor Egas Moniz, Lisboa",
        "Universidade Nova de Lisboa - Campus de Campolide, Lisboa",
        "Faculdade de Ciências Sociais e Humanas - Avenida de Berna 26, Lisboa",
        "ISCTE Instituto Universitário de Lisboa - Avenida das Forças Armadas, Lisboa",
    ],

    /* ===================== CONCELHOS LIMÍTROFES ===================== */
    arredores: [
        "Câmara Municipal de Oeiras - Largo Marquês de Pombal, Oeiras",
        "Forum Sintra - Rua Eugénio Levy, Colares, Sintra",
        "Centro Comercial Cascais Shopping - Rua Afonso Sanches, Cascais",
        "Parque Biológico de Sintra-Cascais - Estrada da Patameira, Sintra",
        "Praia de São João do Estoril - Avenida Marginal, São João do Estoril",
        "Praia de São Pedro do Estoril - Avenida Marginal, São Pedro do Estoril",
        "Praia de Parede - Avenida Marginal, Parede",
        "Praia de Carcavelos - Praia de Carcavelos, Cascais",
        "Forte de São Julião da Barra - Paço de Arcos, Oeiras",
        "Palácio Nacional de Queluz - Largo do Palácio, Queluz",
        "Aqueduto das Águas Livres - Calçada da Quintinha, Lisboa",
        "Monsanto Parque Florestal - Estrada de Monsanto, Lisboa",
        "Centro de Congressos de Lisboa - Praça das Indústrias, Lisboa",
        "FIL Feira Internacional de Lisboa - Parque das Nações, Lisboa",
        "Almada Forum - Praça Europa, Almada",
        "Costa da Caparica - Avenida General Humberto Delgado, Almada",
        "Arrábida - Parque Natural da Arrábida, Setúbal",
        "Sesimbra - Rua 25 de Abril 25, Sesimbra",
        "Palmela - Castelo de Palmela, Palmela",
    ],

    /* ===================== OUTRAS CIDADES ===================== */
    lisboa: [
        // Avenidas principais
        "Avenida da Liberdade, Lisboa",
        "Avenida 24 de Julho, Lisboa", 
        "Avenida Almirante Reis, Lisboa",
        "Avenida de Roma, Lisboa",
        "Avenida dos Combatentes, Lisboa",
        "Avenida da República, Lisboa",
        "Avenida Fontes Pereira de Melo, Lisboa",
        "Avenida Duque de Loulé, Lisboa",
        "Avenida José Malhoa, Lisboa",
        "Avenida de Berna, Lisboa",
        
        // Ruas do Chiado e Baixa
        "Rua Augusta, Lisboa",
        "Rua do Ouro, Lisboa",
        "Rua da Prata, Lisboa",
        "Rua Nova do Almada, Lisboa",
        "Rua Garrett, Lisboa",
        "Rua Serpa Pinto, Lisboa",
        "Rua Ivens, Lisboa",
        "Rua do Carmo, Lisboa",
        
        // Bairros históricos
        "Rua das Portas de Santo Antão, Lisboa",
        "Rua da Palma, Lisboa",
        "Rua da Madalena, Lisboa",
        "Rua de São João da Praça, Lisboa",
        "Rua dos Bacalhoeiros, Lisboa",
        "Rua dos Correeiros, Lisboa",
        "Rua da Conceição, Lisboa",
        "Rua de Santa Justa, Lisboa",
        
        // Alfama
        "Rua de São Miguel, Lisboa",
        "Rua de São Pedro, Lisboa",
        "Rua de Santiago, Lisboa",
        "Rua das Escolas, Lisboa",
        "Rua do Espírito Santo, Lisboa",
        "Largo das Portas do Sol, Lisboa",
        "Largo da Severa, Lisboa",
        
        // Belém
        "Rua de Belém, Lisboa",
        "Rua da Junqueira, Lisboa",
        "Avenida de Brasília, Lisboa",
        "Praça Afonso de Albuquerque, Lisboa",
        "Largo do Paço, Lisboa",
        
        // Saldanha e Avenidas Novas
        "Rua Castilho, Lisboa",
        "Rua Rodrigo da Fonseca, Lisboa",
        "Rua Tomás Ribeiro, Lisboa",
        "Rua Artilharia Um, Lisboa",
        "Rua Artilharia Dois, Lisboa",
        "Rua de São João de Brito, Lisboa",
        "Rua Professor Alfredo da Costa, Lisboa",
        
        // Campo de Ourique
        "Rua Campo de Ourique, Lisboa",
        "Rua Tomás da Anunciação, Lisboa",
        "Rua Saraiva de Carvalho, Lisboa",
        "Rua Domingos Sequeira, Lisboa",
        
        // Príncipe Real
        "Rua Dom Pedro V, Lisboa",
        "Rua da Escola Politécnica, Lisboa",
        "Rua de São Marçal, Lisboa",
        "Rua de São José, Lisboa",
        
        // Estações e Transportes
        "Estação de Santa Apolónia, Lisboa",
        "Estação do Rossio, Lisboa",
        "Estação de Cais do Sodré, Lisboa",
        "Estação de Entrecampos, Lisboa",
        "Estação de Sete Rios, Lisboa",
        "Estação de Roma-Areeiro, Lisboa",
        "Estação do Oriente, Lisboa",
        "Aeroporto Humberto Delgado, Lisboa",
        
        // Hospitais
        "Hospital de Santa Maria, Lisboa",
        "Hospital de São José, Lisboa",
        "Hospital de Curry Cabral, Lisboa",
        "Hospital de Dona Estefânia, Lisboa",
        "Hospital de Santa Marta, Lisboa",
        "Hospital da Luz, Lisboa",
        "Hospital da CUF, Lisboa",
        
        // Shopping Centers
        "Centro Comercial Colombo, Lisboa",
        "Centro Comercial Vasco da Gama, Lisboa",
        "El Corte Inglés, Lisboa",
        "Amoreiras Shopping Center, Lisboa",
        "Centro Comercial Campo Pequeno, Lisboa",
        
        // Universidades
        "Universidade de Lisboa, Lisboa",
        "Universidade Nova de Lisboa, Lisboa",
        "Instituto Superior Técnico, Lisboa",
        "Faculdade de Direito de Lisboa, Lisboa",
        "Faculdade de Medicina de Lisboa, Lisboa"
    ],
    
    porto: [
        // Avenidas principais
        "Avenida dos Aliados, Porto",
        "Avenida da Boavista, Porto",
        "Avenida de França, Porto",
        "Avenida da República, Porto",
        "Avenida de Sidónio Pais, Porto",
        
        // Ribeira e Centro Histórico
        "Rua da Ribeira, Porto",
        "Rua de Miguel Bombarda, Porto",
        "Rua de Cedofeita, Porto",
        "Rua de Santa Catarina, Porto",
        "Rua Formosa, Porto",
        "Rua de 31 de Janeiro, Porto",
        "Rua de Passos Manuel, Porto",
        "Rua de Sá da Bandeira, Porto",
        
        // Baixa
        "Rua do Almada, Porto",
        "Rua de Ferreira Borges, Porto",
        "Rua de José Falcão, Porto",
        "Rua de Mouzinho da Silveira, Porto",
        "Rua de São João, Porto",
        
        // Foz do Douro
        "Rua do Passeio Alegre, Porto",
        "Rua de Monte Russo, Porto",
        "Rua de Guedes de Azevedo, Porto",
        "Rua de Diogo Brandão, Porto",
        
        // Estações e Transportes
        "Estação São Bento, Porto",
        "Estação de Campanhã, Porto",
        "Estação de Contumil, Porto",
        "Aeroporto Francisco Sá Carneiro, Porto",
        
        // Pontes
        "Ponte Dom Luís I, Porto",
        "Ponte do Infante, Porto",
        "Ponte de Arrábida, Porto",
        
        // Hospitais
        "Hospital de São João, Porto",
        "Hospital Santo António, Porto",
        "Centro Hospitalar do Porto, Porto",
        
        // Shopping
        "Centro Comercial NorteShopping, Porto",
        "Centro Comercial GaiaShopping, Vila Nova de Gaia",
        "El Corte Inglés, Porto"
    ],
    
    outrasCidades: [
        // Coimbra
        "Praça da República, Coimbra",
        "Rua da Sofia, Coimbra",
        "Avenida Sá da Bandeira, Coimbra",
        "Rua Ferreira Borges, Coimbra",
        "Universidade de Coimbra, Coimbra",
        "Hospital da Universidade de Coimbra, Coimbra",
        
        // Braga
        "Avenida Central, Braga",
        "Rua do Souto, Braga",
        "Rua D. Diogo de Sousa, Braga",
        "Universidade do Minho, Braga",
        "Hospital de Braga, Braga",
        
        // Faro
        "Avenida 5 de Outubro, Faro",
        "Rua de Portugal, Faro",
        "Praça D. Francisco Gomes, Faro",
        "Aeroporto de Faro, Faro",
        "Hospital de Faro, Faro",
        
        // Funchal
        "Avenida do Mar, Funchal",
        "Rua de Santa Maria, Funchal",
        "Avenida Arriaga, Funchal",
        "Aeroporto da Madeira, Funchal",
        "Hospital Dr. Nélio Mendonça, Funchal",
        
        // Aveiro
        "Avenida Dr. Lourenço Peixinho, Aveiro",
        "Rua de José Estêvão, Aveiro",
        "Universidade de Aveiro, Aveiro",
        "Hospital Infante D. Pedro, Aveiro",
        
        // Leiria
        "Avenida Heróis de Angola, Leiria",
        "Rua de Portugal, Leiria",
        "Hospital de Santo André, Leiria",
        
        // Évora
        "Praça do Giraldo, Évora",
        "Rua de Serpa Pinto, Évora",
        "Universidade de Évora, Évora",
        "Hospital do Espírito Santo, Évora",
        
        // Viseu
        "Avenida Europa, Viseu",
        "Rua Augusto Hilário, Viseu",
        "Hospital de São Teotónio, Viseu",
        
        // Setúbal
        "Avenida Luísa Todi, Setúbal",
        "Rua da Liberdade, Setúbal",
        "Hospital de São Bernardo, Setúbal"
    ],
    
    principaisPOIs: [
        // Aeroportos
        "Aeroporto Humberto Delgado, Lisboa",
        "Aeroporto Francisco Sá Carneiro, Porto",
        "Aeroporto de Faro, Faro",
        "Aeroporto da Madeira, Funchal",
        "Aeroporto dos Açores, Ponta Delgada",
        
        // Estações de Comboio Principais
        "Estação de Santa Apolónia, Lisboa",
        "Estação do Oriente, Lisboa",
        "Estação de Entrecampos, Lisboa",
        "Estação São Bento, Porto",
        "Estação de Campanhã, Porto",
        "Estação de Coimbra-B, Coimbra",
        "Estação de Faro, Faro",
        
        // Hospitais Centrais
        "Hospital de Santa Maria, Lisboa",
        "Hospital de São José, Lisboa",
        "Hospital de São João, Porto",
        "Hospital Santo António, Porto",
        "Hospital da Universidade de Coimbra, Coimbra",
        "Hospital de Faro, Faro",
        
        // Universidades
        "Universidade de Lisboa, Lisboa",
        "Universidade do Porto, Porto",
        "Universidade de Coimbra, Coimbra",
        "Universidade Nova de Lisboa, Lisboa",
        "Universidade do Minho, Braga",
        "Universidade de Aveiro, Aveiro",
        
        // Shopping Centers Nacionais
        "Centro Comercial Colombo, Lisboa",
        "Centro Comercial Vasco da Gama, Lisboa",
        "Centro Comercial NorteShopping, Porto",
        "GaiaShopping, Vila Nova de Gaia",
        "Dolce Vita Tejo, Amadora",
        "Almada Fórum, Almada",
        
        // Pontes e Monumentos
        "Ponte 25 de Abril, Lisboa",
        "Ponte Vasco da Gama, Lisboa",
        "Ponte Dom Luís I, Porto",
        "Torre de Belém, Lisboa",
        "Mosteiro dos Jerónimos, Lisboa",
        "Sé de Lisboa, Lisboa",
        "Sé do Porto, Porto",
        
        // Praias Principais
        "Praia da Rocha, Portimão",
        "Praia da Falésia, Albufeira",
        "Praia de Cascais, Cascais",
        "Praia da Costa da Caparica, Almada",
        "Praia de Matosinhos, Matosinhos",
        "Praia da Nazaré, Nazaré",
        
        // Parques e Jardins
        "Parque das Nações, Lisboa",
        "Parque Eduardo VII, Lisboa",
        "Jardim da Estrela, Lisboa",
        "Parque da Cidade do Porto, Porto",
        "Jardim Botânico do Porto, Porto",
        "Jardim Botânico de Coimbra, Coimbra"
    ]
};

// Função para buscar endereços
function searchAddresses(query) {
    const results = [];
    const queryLower = query.toLowerCase();
    
    // Buscar em todas as categorias
    Object.values(portugalAddresses).flat().forEach(address => {
        if (address.toLowerCase().includes(queryLower)) {
            results.push(address);
        }
    });
    
    return results.slice(0, 12); // Limitar a 12 resultados
}

// Exportar para uso global
window.portugalAddresses = portugalAddresses;
window.searchAddresses = searchAddresses;

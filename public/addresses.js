// Base de dados completa de endereços de Portugal
const portugalAddresses = {
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
    
    return results.slice(0, 10); // Limitar a 10 resultados
}

// Exportar para uso global
window.portugalAddresses = portugalAddresses;
window.searchAddresses = searchAddresses;

const BASE_URL = 'https://rickandmortyapi.com/api/character';

// Estado da aplicação
const state = {
    page: 1,
    name: '',
    status: '',
    species: '',
    totalPages: 1
};

// Elementos do DOM
const cardsContainer = document.getElementById('cards-container');
const searchInput = document.getElementById('search-input');
const statusFilter = document.getElementById('status-filter');
const speciesFilter = document.getElementById('species-filter');
const resetBtn = document.getElementById('reset-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const resultsCount = document.getElementById('results-count');
const pageIndicator = document.getElementById('page-indicator');
const paginationInfo = document.getElementById('pagination-info');

// Elementos do Modal
const modal = document.getElementById('character-modal');
const modalBody = document.getElementById('modal-body');
const closeModalBtn = document.getElementById('close-modal');

// Debounce para evitar requisições excessivas enquanto o usuário digita
let debounceTimer;

// Exibe placeholders animados enquanto os dados carregam
function renderSkeletons() {
    cardsContainer.innerHTML = '';
    for (let i = 0; i < 8; i++) {
        const skeleton = document.createElement('div');
        skeleton.classList.add('skeleton');
        cardsContainer.appendChild(skeleton);
    }
}

// Monta a URL com parâmetros dinâmicos e consome a API via fetch
function fetchCharacters() {
    renderSkeletons();

    const params = new URLSearchParams({
        page: state.page
    });

    if (state.name) params.append('name', state.name);
    if (state.status) params.append('status', state.status);
    if (state.species) params.append('species', state.species);

    const url = `${BASE_URL}?${params.toString()}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Nenhum personagem encontrado com esses filtros.');
                }
                throw new Error('Falha ao conectar com a API.');
            }
            return response.json();
        })
        .then(data => {
            state.totalPages = data.info.pages;
            updateMetaUI(data.info.count);
            renderCards(data.results);
        })
        .catch(error => {
            renderEmptyState(error.message);
        });
}

// Atualiza contadores e estado dos botões de paginação
function updateMetaUI(totalCount) {
    resultsCount.textContent = `${totalCount} personagens encontrados`;
    pageIndicator.textContent = `Página ${state.page} de ${state.totalPages}`;
    paginationInfo.textContent = `${state.page} de ${state.totalPages}`;

    prevBtn.disabled = state.page <= 1;
    nextBtn.disabled = state.page >= state.totalPages;
}

// Criação dinâmica dos cards no DOM usando createElement e appendChild
function renderCards(characters) {
    cardsContainer.innerHTML = '';

    characters.forEach(character => {
        // Container principal do Card
        const card = document.createElement('article');
        card.classList.add('card');
        card.addEventListener('click', () => openCharacterModal(character));

        // Wrapper da imagem + Badge de Status
        const imgWrapper = document.createElement('div');
        imgWrapper.classList.add('card-image-wrapper');

        const img = document.createElement('img');
        img.src = character.image;
        img.alt = character.name;
        img.loading = 'lazy';

        const statusPill = document.createElement('span');
        statusPill.classList.add('status-pill');

        const dot = document.createElement('span');
        dot.classList.add('dot', `dot-${character.status}`);

        const statusText = document.createTextNode(character.status);

        statusPill.appendChild(dot);
        statusPill.appendChild(statusText);
        imgWrapper.appendChild(img);
        imgWrapper.appendChild(statusPill);

        // Corpo textual do Card
        const cardBody = document.createElement('div');
        cardBody.classList.add('card-body');

        const title = document.createElement('h3');
        title.classList.add('card-title');
        title.textContent = character.name;

        const subtitle = document.createElement('p');
        subtitle.classList.add('card-subtitle');
        subtitle.textContent = `${character.species} • ${character.gender}`;

        const locationBox = document.createElement('div');
        locationBox.classList.add('card-location');
        locationBox.textContent = 'Última localização:';

        const locationName = document.createElement('span');
        locationName.textContent = character.location.name;

        locationBox.appendChild(locationName);

        // Anexando elementos filhos ao corpo do card
        cardBody.appendChild(title);
        cardBody.appendChild(subtitle);
        cardBody.appendChild(locationBox);

        // Anexando imagem e corpo ao card principal
        card.appendChild(imgWrapper);
        card.appendChild(cardBody);

        // Inserindo o card no grid da página
        cardsContainer.appendChild(card);
    });
}

// Estado exibido quando não há resultados na busca
function renderEmptyState(message) {
    cardsContainer.innerHTML = '';
    resultsCount.textContent = '0 resultados';
    pageIndicator.textContent = 'Página 0';
    paginationInfo.textContent = '0 de 0';
    prevBtn.disabled = true;
    nextBtn.disabled = true;

    const emptyDiv = document.createElement('div');
    emptyDiv.classList.add('empty-state');

    const msgTitle = document.createElement('h3');
    msgTitle.textContent = message;
    msgTitle.style.marginBottom = '0.5rem';
    msgTitle.style.color = '#f8fafc';

    const msgHint = document.createElement('p');
    msgHint.textContent = 'Tente buscar por outro nome ou clique em "Limpar" para redefinir os filtros.';

    emptyDiv.appendChild(msgTitle);
    emptyDiv.appendChild(msgHint);
    cardsContainer.appendChild(emptyDiv);
}

// Abre o Modal com ficha técnica completa do personagem clicado
function openCharacterModal(character) {
    modalBody.innerHTML = '';

    const img = document.createElement('img');
    img.src = character.image;
    img.alt = character.name;

    const details = document.createElement('div');
    details.classList.add('modal-details');

    const name = document.createElement('h2');
    name.textContent = character.name;

    const specs = [
        { label: 'Status e Espécie', value: `${character.status} — ${character.species}` },
        { label: 'Gênero', value: character.gender },
        { label: 'Dimensão de Origem', value: character.origin.name },
        { label: 'Localização Atual', value: character.location.name },
        { label: 'Participações', value: `${character.episode.length} episódio(s)` }
    ];

    details.appendChild(name);

    specs.forEach(item => {
        const row = document.createElement('div');
        row.classList.add('detail-row');

        const strong = document.createElement('strong');
        strong.textContent = item.label;

        const val = document.createTextNode(item.value);

        row.appendChild(strong);
        row.appendChild(val);
        details.appendChild(row);
    });

    modalBody.appendChild(img);
    modalBody.appendChild(details);
    modal.classList.remove('hidden');
}

// Eventos de interação do usuário
searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        state.name = e.target.value.trim();
        state.page = 1;
        fetchCharacters();
    }, 400);
});

statusFilter.addEventListener('change', (e) => {
    state.status = e.target.value;
    state.page = 1;
    fetchCharacters();
});

speciesFilter.addEventListener('change', (e) => {
    state.species = e.target.value;
    state.page = 1;
    fetchCharacters();
});

resetBtn.addEventListener('click', () => {
    state.name = '';
    state.status = '';
    state.species = '';
    state.page = 1;

    searchInput.value = '';
    statusFilter.value = '';
    speciesFilter.value = '';

    fetchCharacters();
});

prevBtn.addEventListener('click', () => {
    if (state.page > 1) {
        state.page--;
        fetchCharacters();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

nextBtn.addEventListener('click', () => {
    if (state.page < state.totalPages) {
        state.page++;
        fetchCharacters();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

// Fechar modal no botão X, clicando fora ou apertando ESC
closeModalBtn.addEventListener('click', () => modal.classList.add('hidden'));
modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        modal.classList.add('hidden');
    }
});

// Inicialização
fetchCharacters();
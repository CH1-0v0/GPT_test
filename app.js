const state = { laws: [], query: '' };

const $ = (selector) => document.querySelector(selector);
const cardsEl = $('#cards');
const countEl = $('#resultCount');
const statusEl = $('#statusText');
const keywordEl = $('#keyword');
const emptyEl = $('#emptyState');
const template = $('#cardTemplate');

function normalize(text = '') {
  return String(text).toLocaleLowerCase('ko-KR').trim();
}

function makeSummary(text, limit = 110) {
  const compact = String(text).replace(/\s+/g, ' ').trim();
  if (compact.length <= limit) return compact;
  return `${compact.slice(0, limit).trim()}…`;
}

function highlight(container, text, query) {
  container.textContent = '';
  if (!query) {
    container.textContent = text;
    return;
  }

  const source = String(text);
  const lowerSource = source.toLocaleLowerCase('ko-KR');
  const lowerQuery = normalize(query);
  let cursor = 0;
  let index = lowerSource.indexOf(lowerQuery, cursor);

  while (index !== -1) {
    container.append(document.createTextNode(source.slice(cursor, index)));
    const mark = document.createElement('mark');
    mark.textContent = source.slice(index, index + query.length);
    container.append(mark);
    cursor = index + query.length;
    index = lowerSource.indexOf(lowerQuery, cursor);
  }
  container.append(document.createTextNode(source.slice(cursor)));
}

function render() {
  const q = normalize(state.query);
  const filtered = state.laws.filter(item => {
    if (!q) return true;
    return normalize(item['제목']).includes(q) || normalize(item['본문']).includes(q);
  });

  cardsEl.replaceChildren();
  countEl.textContent = `결과 ${filtered.length}건`;
  statusEl.textContent = q ? `“${state.query}” 검색 결과` : '전체 조항을 표시하고 있습니다.';
  emptyEl.hidden = filtered.length !== 0;

  for (const item of filtered) {
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.law-card');
    const noEl = node.querySelector('.article-no');
    const titleEl = node.querySelector('.article-title');
    const summaryEl = node.querySelector('.article-summary');
    const detailBtn = node.querySelector('.detail-btn');
    const fullEl = node.querySelector('.article-full');

    noEl.textContent = item['조'];
    highlight(titleEl, item['제목'], state.query);
    highlight(summaryEl, makeSummary(item['본문']), state.query);
    highlight(fullEl, item['본문'], state.query);

    detailBtn.addEventListener('click', () => {
      const open = detailBtn.getAttribute('aria-expanded') === 'true';
      detailBtn.setAttribute('aria-expanded', String(!open));
      detailBtn.textContent = open ? '본문 보기' : '본문 닫기';
      fullEl.hidden = open;
    });

    cardsEl.append(card);
  }
}

async function loadLaws() {
  try {
    const response = await fetch('./조항데이터.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('JSON 최상위 값이 배열이 아닙니다.');
    state.laws = data;
    render();
  } catch (error) {
    console.error(error);
    countEl.textContent = '결과 0건';
    statusEl.textContent = '조항데이터.json을 불러오지 못했습니다. 로컬 서버에서 실행해 주세요.';
    cardsEl.innerHTML = `<div class="empty" style="grid-column:1/-1"><strong>데이터 로드 실패</strong><p>터미널에서 이 폴더로 이동한 뒤 <code>python -m http.server 8000</code>을 실행하고 브라우저에서 <code>http://localhost:8000</code>을 열어 주세요.</p></div>`;
  }
}

keywordEl.addEventListener('input', (event) => {
  state.query = event.target.value.trim();
  render();
});

$('#clearBtn').addEventListener('click', () => {
  keywordEl.value = '';
  state.query = '';
  keywordEl.focus();
  render();
});

loadLaws();

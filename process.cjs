const fs = require('fs');

const raw = fs.readFileSync('raw.csv', 'utf8');
const lines = raw.split('\n');

const out = [];
let idCounter = 1;

// very basic CSV parsing handling quoted newlines
const rows = [];
let currentRow = [];
let currentCell = '';
let insideQuote = false;

for (let i = 0; i < raw.length; i++) {
  const c = raw[i];
  if (c === '"') {
    if (insideQuote && raw[i+1] === '"') {
      currentCell += '"';
      i++;
    } else {
      insideQuote = !insideQuote;
    }
  } else if (c === ',' && !insideQuote) {
    currentRow.push(currentCell);
    currentCell = '';
  } else if (c === '\n' && !insideQuote) {
    currentRow.push(currentCell);
    rows.push(currentRow);
    currentRow = [];
    currentCell = '';
  } else {
    currentCell += c;
  }
}
if (currentRow.length > 0 || currentCell) {
  currentRow.push(currentCell);
  rows.push(currentRow);
}

// Find header
const headerIndex = rows.findIndex(row => row.some(cell => cell.includes('학생 이름')));
if (headerIndex !== -1) {
  const dataRows = rows.slice(headerIndex + 1).filter(r => r.length > 1 && r[1].trim() !== '');

  for (const row of dataRows) {
    if (out.length >= 200) break;

    const dateRaw = row[0] || '';
    const name = row[1] || '';
    const gradeRaw = row[2] || '';
    const school = row[3] || '';
    const statusRaw = row[4] || '';
    const classRaw = row[5] || '';
    const statusNoteRaw = row[6] || '';
    
    // Notes are from col 7, 8, 9...
    const notesRaw = row.slice(7).filter(n => n.trim() !== '');

    let date = dateRaw.replace(/년\s*/g, '-').replace(/월\s*/g, '-').replace(/일\s*/g, '').trim();
    if (date.startsWith('24-') || date.startsWith('25-') || date.startsWith('26-')) {
      date = '20' + date;
    }
    // format date to YYYY-MM-DD
    const parts = date.split('-');
    if (parts.length === 3) {
      date = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }

    let grade = gradeRaw.replace(/[^0-9]/g, '');
    if (grade) {
      grade = 'G' + grade;
    }

    let status = '단순문의';
    if (statusRaw.includes('입원')) status = '원생';
    else if (statusRaw.includes('답장 X') || statusRaw.includes('답장X') || statusRaw.includes('답장 없음') || statusNoteRaw.includes('답장')) {
      status = statusRaw.includes('레벨테스트') ? '레벨테스트 상담 후 답장 X' : '반배정 후 답장 X';
    } else if (statusNoteRaw.includes('대기')) {
      status = '새로운 반 개설 대기중'; // simplifying
    } else if (statusRaw.includes('원생')) {
      status = '원생';
    }

    let className = classRaw || '-';
    if (statusNoteRaw.includes('대기') && className === '-') {
      className = statusNoteRaw.substring(0, 15) + '...';
    }

    const notes = [];
    for (const note of notesRaw) {
      // try to extract date and method
      const match = note.match(/(2[456]년\s*\d+월\s*\d+일?)\s*(보톡|전화|방문|카톡|와츠앱|대면상담|상담|문자)?:?\s*(.*)/is);
      if (match) {
        let nDate = match[1].replace(/년\s*/g, '-').replace(/월\s*/g, '-').replace(/일\s*/g, '').trim();
        if (nDate.startsWith('24-') || nDate.startsWith('25-') || nDate.startsWith('26-')) {
          nDate = '20' + nDate;
        }
        let nMethod = match[2] || '일반 전화';
        if (nMethod.includes('보톡')) nMethod = '카카오톡 보이스톡';
        if (nMethod.includes('카톡')) nMethod = '카카오톡';
        if (nMethod.includes('대면') || nMethod.includes('방문')) nMethod = '직접 방문';
        if (nMethod.includes('와츠앱')) nMethod = '왓츠앱';
        notes.push({ date: nDate, method: nMethod, content: match[3].trim() || note });
      } else {
        notes.push({ date: date || '알 수 없음', method: '알 수 없음', content: note });
      }
    }

    if (notes.length === 0) {
      notes.push({ date: date, method: '알 수 없음', content: '내용 없음' });
    }

    out.push({
      id: String(idCounter++),
      date,
      name,
      school,
      grade,
      status,
      className,
      notes
    });
  }
}

fs.writeFileSync('src/data.ts', `import { Consultation } from './types';\n\nexport const initialData: Consultation[] = ${JSON.stringify(out, null, 2)};`);


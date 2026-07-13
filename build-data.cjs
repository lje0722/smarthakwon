const fs = require('fs');

// ---------- 공통 CSV 파서 (따옴표 안 개행 처리) ----------
function parseCSV(raw) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuote = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c === '"') {
      if (inQuote && raw[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (c === ',' && !inQuote) {
      row.push(cell);
      cell = '';
    } else if ((c === '\n' || c === '\r') && !inQuote) {
      if (c === '\r' && raw[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += c;
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

const MONTHS = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

// "17 Aug 2024" / "8/Jul/2026" / "3 Apr 2023" -> YYYY-MM-DD
function parseEngDate(s) {
  if (!s) return '';
  const m = s.trim().match(/(\d{1,2})\s*[\/\s]\s*([A-Za-z]{3,})\s*[\/\s]\s*(\d{4})/);
  if (m) {
    const day = m[1].padStart(2, '0');
    const mon = MONTHS[m[2].slice(0, 3).toLowerCase()];
    if (mon) return `${m[3]}-${mon}-${day}`;
  }
  return s.trim();
}

// "23.08.02 내용" -> {date, content}
function parseNoteDate(text) {
  const m = text.match(/^\s*(\d{2})\.(\d{1,2})\.(\d{1,2})\s*(.*)/s);
  if (m) {
    return {
      date: `20${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`,
      content: (m[4] || '').trim() || text.trim(),
    };
  }
  return { date: '', content: text.trim() };
}

function detectMethod(text) {
  if (/보이스톡|보톡/.test(text)) return '카카오톡 보이스톡';
  if (/카톡|카카오/.test(text)) return '카카오톡';
  if (/와츠앱|왓츠앱|whats/i.test(text)) return '왓츠앱';
  if (/방문|대면/.test(text)) return '직접 방문';
  if (/문자|sms/i.test(text)) return '문자';
  if (/통화|전화/.test(text)) return '일반 전화';
  return '알 수 없음';
}

const out = [];
let idCounter = 1;

// =======================================================
// 1) raw.csv -> 예비원생(문의) 데이터 (기존 원생은 제외, 새 status 명으로 매핑)
// =======================================================
const raw = fs.readFileSync('raw.csv', 'utf8');
const rawRows = parseCSV(raw);
const headerIndex = rawRows.findIndex((r) => r.some((c) => c.includes('학생 이름')));

if (headerIndex !== -1) {
  const dataRows = rawRows.slice(headerIndex + 1).filter((r) => r.length > 1 && r[1].trim() !== '');

  for (const row of dataRows) {
    const dateRaw = row[0] || '';
    const name = row[1] || '';
    const gradeRaw = row[2] || '';
    const school = row[3] || '';
    const statusRaw = row[4] || '';
    const classRaw = row[5] || '';
    const statusNoteRaw = row[6] || '';
    const notesRaw = row.slice(7).filter((n) => n.trim() !== '');

    // 기존 원생은 새 명부(students.csv)로 대체하므로 제외
    if (statusRaw.includes('입원') || statusRaw.includes('원생')) continue;

    let date = dateRaw.replace(/년\s*/g, '-').replace(/월\s*/g, '-').replace(/일\s*/g, '').trim();
    if (/^2[456]-/.test(date)) date = '20' + date;
    const parts = date.split('-');
    if (parts.length === 3) date = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;

    let grade = gradeRaw.replace(/[^0-9]/g, '');
    if (grade) grade = 'G' + grade;

    // status 매핑 (구 -> 신)
    let status = '초기 문의';
    if (statusRaw.includes('답장') || statusNoteRaw.includes('답장')) {
      status = statusRaw.includes('레벨테스트')
        ? '레벨테스트 완료 (등록 여부 미정)'
        : '반 배정 완료 (등록 대기)';
    } else if (statusNoteRaw.includes('대기')) {
      status = '신규 반 개설 대기';
    }

    let className = classRaw || '-';
    if (statusNoteRaw.includes('대기') && className === '-') {
      className = statusNoteRaw.substring(0, 15) + '...';
    }

    const notes = [];
    for (const note of notesRaw) {
      const match = note.match(/(2[456]년\s*\d+월\s*\d+일?)\s*(보톡|전화|방문|카톡|와츠앱|대면상담|상담|문자)?:?\s*(.*)/is);
      if (match) {
        let nDate = match[1].replace(/년\s*/g, '-').replace(/월\s*/g, '-').replace(/일\s*/g, '').trim();
        if (/^2[456]-/.test(nDate)) nDate = '20' + nDate;
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
    if (notes.length === 0) notes.push({ date, method: '알 수 없음', content: '내용 없음' });

    out.push({
      id: String(idCounter++),
      date,
      name,
      school,
      grade,
      status,
      className,
      studentNumber: '',
      studentPhone: '',
      parentPhone: '',
      email: '',
      notes,
    });
  }
}

// =======================================================
// 2) students.csv -> 원생(등록완료) 데이터
// 컬럼: 0이름 1형제 2학교 3이메일 4전화 5현수강수업 6seq 7등록일 8경로 9기간 10퇴원
//       11~22 상담 23학생번호 ...
// =======================================================
const stuRaw = fs.readFileSync('students.csv', 'utf8');
const stuRows = parseCSV(stuRaw);
let seq = 0;
for (let i = 1; i < stuRows.length; i++) {
  const row = stuRows[i];
  const name = (row[0] || '').trim();
  if (!name) continue;
  seq++;

  const school = (row[2] || '').trim();
  const email = (row[3] || '').trim();
  const phone = (row[4] || '').trim();
  const className = (row[5] || '').trim() || '-';
  const enrollDate = parseEngDate(row[7] || '');

  // 학생번호: STU 패턴이 있으면 사용, 없으면 생성
  let studentNumber = '';
  for (let c = 23; c < row.length; c++) {
    if (/STU/i.test(row[c] || '')) {
      studentNumber = row[c].trim();
      break;
    }
  }
  if (!studentNumber) studentNumber = `STU2026-${String(seq).padStart(4, '0')}`;

  // 학년: 현 수강 수업에서 G숫자 추출
  const gradeMatch = className.match(/G\s*(\d{1,2})/i);
  const grade = gradeMatch ? 'G' + gradeMatch[1] : '';

  // 상담 노트: 11~22 컬럼 중 비어있지 않은 것 (STU 컬럼 제외)
  const notes = [];
  for (let c = 11; c <= 22; c++) {
    const raw = (row[c] || '').trim();
    if (!raw || /STU/i.test(raw)) continue;
    const { date, content } = parseNoteDate(raw);
    notes.push({
      date: date || enrollDate || '알 수 없음',
      method: detectMethod(raw),
      content,
    });
  }
  if (notes.length === 0) {
    notes.push({ date: enrollDate || '알 수 없음', method: '알 수 없음', content: '상담 내역 없음' });
  }

  out.push({
    id: String(idCounter++),
    date: enrollDate,
    name,
    school,
    grade,
    status: '원생 (등록완료)',
    className,
    studentNumber,
    studentPhone: phone,
    parentPhone: '',
    email,
    notes,
  });
}

fs.writeFileSync(
  'src/data.ts',
  `import { Consultation } from './types';\n\nexport const initialData: Consultation[] = ${JSON.stringify(out, null, 2)};\n`
);

const enrolled = out.filter((o) => o.status === '원생 (등록완료)').length;
console.log(`총 ${out.length}건 생성 (원생 ${enrolled}명, 예비원생 ${out.length - enrolled}명)`);

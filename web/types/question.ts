// 교재형 도메인(edu) 최소 스키마 — sungjin_book에 처음 들이는 시험지/문항 모델.
//
// 절대 원칙
//   1) 이 파일은 web/types/book.ts와 어떤 import도 공유하지 않는다.
//   2) BookBlock 등 단행본 유니온에 끼우려는 시도 금지. edu와 book은 다른 도메인이다.
//   3) 필드명은 experiments/edu-import/out/korean-questions.json의 실제 키를 그대로 따른다.
//      snake_case 유지 — 실험 산출물과 1:1 매칭하기 위함. 본앱 UI에 들일 때 camelCase
//      변환기를 별도로 둘 예정(아직 작성 안 함).
//
// 처리 범위 (v0)
//   - 평가원형 5지선다 문항
//   - 묶음 지문 + 딸린 문항
//   - 배점, ①~⑤ 보기, 발문/보기에 끼어든 <그림>/<표> placeholder 마킹
// 미지원 (의도적)
//   - 수식 본문 복원, 이미지/도형 본체, 표 내부 셀, 정답·해설

/** 본문에 끼어드는 손실 마커. pyhwp hwp5txt 추출본에서 <그림>/<표>로 나타남. */
export type PlaceholderKind = "그림" | "표";

export interface Choice {
  /** 1~5. ①=1, ②=2, … */
  index: 1 | 2 | 3 | 4 | 5;
  /** 표시용 글리프. JSON과 동일. */
  glyph: "①" | "②" | "③" | "④" | "⑤";
  /** 보기 본문. <그림>/<표> 문자열이 포함될 수 있음. */
  text: string;
  /** 이 보기 텍스트에 placeholder가 끼어 있나. 시험지 렌더에서 회색 박스로 치환. */
  has_placeholder: boolean;
}

/** [N~M] 묶음 지문. 연속된 문항이 같은 passage_id로 묶인다. */
export interface PassageGroup {
  /** 등장 순서대로 부여한 ID. ex) "passage-01". 번호 충돌(35~37이 두 번 등장) 회피용. */
  id: string;
  /** 묶음이 다루는 문항 번호 범위. [시작, 끝] (inclusive). */
  range: [number, number];
  /** 묶음 머리(예: "다음 글을 읽고 물음에 답하시오."). 누락 시 기본 문구. */
  header: string;
  /** 지문 본문. 단락 사이 \n 1개. <그림>/<표> 마커 포함될 수 있음. */
  body: string;
}

/** 5지선다 문항 한 개. */
export interface Question {
  /** 문항 번호. 평가원 선택과목 영역에서 35~45가 두 번 등장하므로 중복 가능. */
  number: number;
  /** 묶음 지문 ID. 독립 문항이면 null. */
  passage_id: string | null;
  /** 발문. [3점] 태그는 stem에서 제거되고 score로 별도 보관. */
  stem: string;
  /** [3점] 표기에서 추출. 없으면 null (배점 미표기 = 평가원 기본 2점). */
  score: number | null;
  /** 보기 목록. 표 안에 묻혀 일부만 추출되면 0~4개일 수 있음(분할기 책임 아님). */
  choices: Choice[];
  stem_has_placeholder: boolean;
  any_choice_has_placeholder: boolean;
}

export interface SourceMeta {
  /** 추출 소스 식별자. ex) "평가원 국어 양식.hwp via hwp5txt" */
  source: string;
  /** ISO 8601 UTC. */
  extracted_at: string;
  /** 스키마 버전. 호환성 추적용. */
  schema: "edu-import/v0";
}

/** 시험지 한 회분 문서. */
export interface QuestionDoc {
  meta: SourceMeta;
  passages: PassageGroup[];
  questions: Question[];
}

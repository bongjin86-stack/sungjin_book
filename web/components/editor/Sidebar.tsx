"use client";

import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Toggle } from "@/components/ui/Toggle";
import { BLOCK_META, THEME_PRESETS, type BookBlock, type BookOptions, type BookTheme } from "@/types/book";

type SidebarTab = "structure" | "style";
type Density = "default" | "loose" | "tight";

interface SidebarProps {
  options: BookOptions;
  onChangeOptions: (patch: Partial<BookOptions>) => void;
  blocks: BookBlock[];
  onReorder: (next: BookBlock[]) => void;
  activeBlockId?: string | null;
  onSelectBlock?: (id: string) => void;
}

const DENSITY_PRESETS: Record<Density, Partial<BookOptions>> = {
  default: { bodyFontSize: "10pt", lineSpacing: "normal", marginPreset: "normal" },
  loose:   { bodyFontSize: "10pt", lineSpacing: "wide",   marginPreset: "wide"   },
  tight:   { bodyFontSize: "9pt",  lineSpacing: "narrow", marginPreset: "narrow" },
};

function currentDensity(o: BookOptions): Density | null {
  for (const key of Object.keys(DENSITY_PRESETS) as Density[]) {
    const p = DENSITY_PRESETS[key];
    if (
      p.bodyFontSize === o.bodyFontSize &&
      p.lineSpacing === o.lineSpacing &&
      p.marginPreset === o.marginPreset
    ) {
      return key;
    }
  }
  return null;
}

export function Sidebar({
  options,
  onChangeOptions,
  blocks,
  onReorder,
  activeBlockId,
  onSelectBlock,
}: SidebarProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const [activeTab, setActiveTab] = useState<SidebarTab>("structure");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // 챕터 자동 번호 보정용 인덱스 맵
  const chapterAutoNum = new Map<string, number>();
  let n = 0;
  for (const b of blocks) {
    if (b.type === "chapter") {
      n += 1;
      chapterAutoNum.set(b.id, n);
    }
  }

  const groupedBlocks = [
    {
      title: "앞부분",
      blocks: blocks.filter((b) => b.type !== "chapter" && b.type !== "interlude" && BLOCK_META[b.type].section === "front"),
    },
    {
      title: "본문",
      blocks: blocks.filter((b) => b.type === "chapter" || b.type === "interlude"),
    },
    {
      title: "뒷부분",
      blocks: blocks.filter((b) => b.type !== "chapter" && b.type !== "interlude" && BLOCK_META[b.type].section === "back"),
    },
  ];

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(blocks, oldIndex, newIndex));
  }

  const chapterCount = blocks.filter((b) => b.type === "chapter").length;
  const density = currentDensity(options);

  return (
    <aside
      className="w-sidebar-w flex-shrink-0 flex flex-col overflow-hidden"
      style={{ background: "var(--bg-pane-left)" }}
    >
      {/* 탭 */}
      <div className="flex border-b border-border flex-shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("structure")}
          className={`flex-1 py-[10px] text-[12px] font-semibold transition-colors ${
            activeTab === "structure"
              ? "text-accent border-b-2 border-accent bg-accent-light"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          책 구성
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("style")}
          className={`flex-1 py-[10px] text-[12px] font-semibold transition-colors ${
            activeTab === "style"
              ? "text-accent border-b-2 border-accent bg-accent-light"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          책 스타일
        </button>
      </div>

      {/* 책 구성 탭 */}
      {activeTab === "structure" && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="px-3 pt-[10px] pb-[6px] flex items-center justify-between flex-shrink-0">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.7px]">
              책 구성
            </span>
            <span className="text-[10px] text-text-muted bg-border px-[7px] py-[2px] rounded-[10px] font-semibold">
              {chapterCount}개 챕터
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-1">
            {blocks.length === 0 ? (
              <div className="py-5 px-[10px] text-center text-[12px] text-text-muted leading-[1.7]">
                <div className="text-[24px] mb-[6px]">📋</div>
                챕터를 저장하면
                <br />
                여기에 쌓입니다.
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  {groupedBlocks.map((section) =>
                    section.blocks.length > 0 ? (
                      <div key={section.title} className="mb-3">
                        <div className="px-2 pb-1 text-[10px] font-bold text-text-muted uppercase tracking-[0.7px]">
                          {section.title}
                        </div>
                        {section.blocks.map((b) => (
                          <SortableTocItem
                            key={b.id}
                            block={b}
                            autoChapterNum={chapterAutoNum.get(b.id)}
                            isActive={activeBlockId === b.id}
                            onSelect={() => onSelectBlock?.(b.id)}
                          />
                        ))}
                      </div>
                    ) : null,
                  )}
                </SortableContext>
              </DndContext>
            )}
          </div>

          <div className="px-2 pt-[6px] pb-[10px] flex-shrink-0" />
        </div>
      )}

      {/* 책 스타일 탭 */}
      {activeTab === "style" && (
        <div className="flex-1 overflow-y-auto px-3 pt-3 pb-[10px]">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.7px] mb-2">
            책 스타일
          </div>

          <PillGroup<BookTheme>
            label="스타일"
            value={options.theme}
            options={[
              { value: "classic", label: "클래식" },
              { value: "modern", label: "모던" },
              { value: "minimal", label: "미니멀" },
            ]}
            onChange={(v) => onChangeOptions({ theme: v, ...THEME_PRESETS[v] })}
          />

          <PillGroup<"with-number" | "title-only">
            label="챕터 제목"
            value={options.showChapterNumber ? "with-number" : "title-only"}
            options={[
              { value: "with-number", label: "번호+제목" },
              { value: "title-only", label: "제목만" },
            ]}
            onChange={(v) => onChangeOptions({ showChapterNumber: v === "with-number" })}
          />

          <PillGroup<Density>
            label="본문 밀도"
            value={density ?? "default"}
            options={[
              { value: "default", label: "기본" },
              { value: "loose", label: "여유" },
              { value: "tight", label: "촘촘" },
            ]}
            onChange={(v) => onChangeOptions(DENSITY_PRESETS[v])}
          />

          <PillGroup<"show" | "hide">
            label="쪽번호"
            value={options.showPageNumber ? "show" : "hide"}
            options={[
              { value: "show", label: "표시" },
              { value: "hide", label: "숨김" },
            ]}
            onChange={(v) => onChangeOptions({ showPageNumber: v === "show" })}
          />

          {/* "표시"일 때만 펼침. Vellum/Atticus 패턴 — 매터/본문 자동 분리.
              사용자가 매번 결정하지 않게 옵션 최소화. */}
          {options.showPageNumber && (
            <div className="pl-2 border-l border-[rgba(0,0,0,0.06)] ml-1 mt-1 mb-1">
              <PillGroup<"bottom-outside" | "bottom-center" | "top-outside">
                label="위치"
                value={options.pageNumberPosition}
                options={[
                  { value: "bottom-outside", label: "하단 바깥" },
                  { value: "bottom-center", label: "하단 가운데" },
                  { value: "top-outside", label: "상단 바깥" },
                ]}
                onChange={(v) => onChangeOptions({ pageNumberPosition: v })}
              />
              <PillGroup<"arabic" | "roman">
                label="본문 형식"
                value={options.pageNumberFormat}
                options={[
                  { value: "arabic", label: "1·2·3" },
                  { value: "roman", label: "i·ii" },
                ]}
                onChange={(v) => onChangeOptions({ pageNumberFormat: v })}
              />
              <PillGroup<"none" | "roman">
                label="앞부분"
                value={options.frontMatterNumbering}
                options={[
                  { value: "none", label: "없음" },
                  { value: "roman", label: "i·ii" },
                ]}
                onChange={(v) => onChangeOptions({ frontMatterNumbering: v })}
              />
              <PillGroup<"show" | "hide">
                label="챕터 시작"
                value={options.hideChapterStartPageNumber ? "hide" : "show"}
                options={[
                  { value: "show", label: "표시" },
                  { value: "hide", label: "숨김" },
                ]}
                onChange={(v) => onChangeOptions({ hideChapterStartPageNumber: v === "hide" })}
              />
            </div>
          )}

          {/* 세부 조정 아코디언 */}
          <button
            type="button"
            onClick={() => setAdvancedOpen((p) => !p)}
            className="w-full mt-3 flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-[0.7px] py-1 hover:text-text-secondary transition-colors"
          >
            <span>세부 조정</span>
            <span className="text-[10px]">{advancedOpen ? "▾" : "▸"}</span>
          </button>

          {advancedOpen && (
            <div className="pt-1">
              <PillGroup
                label="본문 글꼴"
                value={options.bodyFont}
                options={[
                  { value: "serif", label: "바탕" },
                  { value: "sans", label: "돋움" },
                ]}
                onChange={(v) => onChangeOptions({ bodyFont: v })}
              />
              <PillGroup
                label="본문 크기"
                value={options.bodyFontSize}
                options={[
                  { value: "9pt", label: "9" },
                  { value: "10pt", label: "10" },
                  { value: "11pt", label: "11" },
                ]}
                onChange={(v) => onChangeOptions({ bodyFontSize: v })}
              />
              <PillGroup
                label="줄간격"
                value={options.lineSpacing}
                options={[
                  { value: "narrow", label: "좁게" },
                  { value: "normal", label: "보통" },
                  { value: "wide", label: "넓게" },
                ]}
                onChange={(v) => onChangeOptions({ lineSpacing: v })}
              />
              <PillGroup
                label="여백"
                value={options.marginPreset}
                options={[
                  { value: "narrow", label: "좁게" },
                  { value: "normal", label: "보통" },
                  { value: "wide", label: "넓게" },
                ]}
                onChange={(v) => onChangeOptions({ marginPreset: v })}
              />
              <ToggleRow
                label="단락 들여쓰기"
                checked={options.paragraphIndent}
                onChange={(v) => onChangeOptions({ paragraphIndent: v })}
              />
              {/* 챕터 시작 쪽번호는 위 "쪽번호" 그룹 안에서 관리 — 중복 토글 제거 */}
              <PillGroup
                label="장면 전환 구분자"
                value={options.sceneBreakStyle}
                options={[
                  { value: "asterisk", label: "* * *" },
                  { value: "line", label: "선" },
                  { value: "none", label: "없음" },
                ]}
                onChange={(v) => onChangeOptions({ sceneBreakStyle: v })}
              />
              <ToggleRow
                label="러닝 헤더"
                checked={options.runningHeader}
                onChange={(v) => onChangeOptions({ runningHeader: v })}
              />
              <ToggleRow
                label="드롭캡"
                checked={options.dropCaps}
                onChange={(v) => onChangeOptions({ dropCaps: v })}
              />
              <ToggleRow
                label="여백 가이드"
                checked={options.showMarginGuide}
                onChange={(v) => onChangeOptions({ showMarginGuide: v })}
              />
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

function PillGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1 gap-2">
      <span className="text-[12px] text-text-secondary flex-shrink-0">{label}</span>
      <div className="flex gap-1 flex-wrap justify-end">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`px-[9px] py-[3px] rounded-[20px] text-[11px] font-medium border-[1.5px] transition-all ${
                active
                  ? "border-purple bg-purple-light text-purple"
                  : "border-border bg-transparent text-text-muted"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className="flex items-center justify-between py-1 cursor-pointer select-none"
      onClick={() => onChange(!checked)}
    >
      <span className="text-[12px] text-text-secondary">{label}</span>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

function SortableTocItem({
  block,
  autoChapterNum,
  isActive = false,
  onSelect,
}: {
  block: BookBlock;
  autoChapterNum?: number;
  isActive?: boolean;
  onSelect?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  } as const;

  const isChapter = block.type === "chapter";
  const isInterlude = block.type === "interlude";
  const meta = BLOCK_META[block.type];

  const dotColor = isChapter
    ? "bg-accent"
    : isInterlude
    ? "bg-purple"
    : meta.section === "front"
    ? "bg-[#F59E0B]"
    : "bg-[#10B981]";

  // 챕터 표시 문구: 제N장 — {title || 제목 없음}
  let chapterLabel = "";
  if (isChapter) {
    const num = block.chapterNum && block.chapterNum.trim()
      ? block.chapterNum
      : `제${autoChapterNum ?? 1}장`;
    const title = block.title && block.title.trim() ? block.title : "제목 없음";
    chapterLabel = `${num} — ${title}`;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group flex items-center gap-2 px-2 py-[7px] rounded-[7px] cursor-pointer transition-colors mb-px ${
        isActive
          ? "bg-accent/10 ring-1 ring-accent/30"
          : "hover:bg-border"
      }`}
    >
      <span className={`w-[6px] h-[6px] rounded-full flex-shrink-0 ${dotColor}`} />
      <div className="flex-1 min-w-0">
        {isChapter ? (
          <>
            <div className="text-[12px] text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">
              {chapterLabel}
            </div>
            <div className="text-[10px] text-text-muted mt-px">
              챕터 · {block.charCount.toLocaleString()}자
            </div>
          </>
        ) : isInterlude ? (
          <>
            <div className="text-[12px] text-text-primary">간지</div>
            <div className="text-[10px] text-text-muted mt-px">간지 · 드래그로 위치 조정</div>
          </>
        ) : (
          <>
            <div className="text-[12px] text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">
              {(block as { title?: string }).title || meta.label}
            </div>
            <div className="text-[10px] text-text-muted mt-px">
              {getMatterDescription(block.type)}
            </div>
          </>
        )}
      </div>
      <span
        {...attributes}
        {...listeners}
        className="text-[10px] text-text-muted opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing"
      >
        ⠿
      </span>
    </div>
  );
}

function getMatterDescription(type: string): string {
  switch (type) {
    case "half-title": return "책 제목 페이지";
    case "copyright": return "저작권·발행 정보";
    case "toc": return "챕터 목록 자동 생성";
    case "author-bio": return "저자 프로필";
    case "preface": return "서문";
    case "dedication": return "헌정사";
    case "prologue": return "프롤로그";
    case "blurb": return "추천사";
    case "epilogue": return "에필로그";
    case "acknowledgments": return "감사의 글";
    case "bibliography": return "참고문헌";
    default: return "";
  }
}

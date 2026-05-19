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

type SidebarTab = "writing" | "formatting";

interface SidebarProps {
  options: BookOptions;
  onChangeOptions: (patch: Partial<BookOptions>) => void;
  blocks: BookBlock[];
  onReorder: (next: BookBlock[]) => void;
  onAddInterlude: () => void;
  activeBlockId?: string | null;
  onSelectBlock?: (id: string) => void;
}

export function Sidebar({
  options,
  onChangeOptions,
  blocks,
  onReorder,
  onAddInterlude,
  activeBlockId,
  onSelectBlock,
}: SidebarProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const [activeTab, setActiveTab] = useState<SidebarTab>("writing");
  const [advancedOpen, setAdvancedOpen] = useState(false);
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

  const chapterCountForLabel = blocks.length;

  return (
    <aside className="w-sidebar-w flex-shrink-0 bg-sidebar-bg border-r border-border flex flex-col overflow-hidden">
      {/* 탭 */}
      <div className="flex border-b border-border flex-shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("writing")}
          className={`flex-1 py-[10px] text-[12px] font-semibold transition-colors ${
            activeTab === "writing"
              ? "text-accent border-b-2 border-accent bg-accent-light"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          ✏️ 집필
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("formatting")}
          className={`flex-1 py-[10px] text-[12px] font-semibold transition-colors ${
            activeTab === "formatting"
              ? "text-accent border-b-2 border-accent bg-accent-light"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          🎨 포맷팅
        </button>
      </div>

      {/* Writing 탭 — 목차 */}
      {activeTab === "writing" && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="px-3 pt-[10px] pb-[6px] flex items-center justify-between flex-shrink-0">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.7px]">
              목차
            </span>
            <span className="text-[10px] text-text-muted bg-border px-[7px] py-[2px] rounded-[10px] font-semibold">
              {chapterCountForLabel}
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

          <div className="px-2 pt-[6px] pb-[10px] flex-shrink-0">
            <button
              type="button"
              onClick={onAddInterlude}
              className="w-full px-[10px] py-[7px] border-[1.5px] border-dashed border-border rounded-[7px] bg-transparent text-text-muted text-[12px] flex items-center gap-[6px] justify-center transition-all hover:border-purple hover:text-purple hover:bg-purple-light"
            >
              ✦ 간지 추가
            </button>
          </div>
        </div>
      )}

      {/* Formatting 탭 — 옵션 패널 */}
      {activeTab === "formatting" && (
        <div className="flex-1 overflow-y-auto px-3 pt-3 pb-[10px]">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.7px] mb-2">
            테마
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

          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.7px] mt-3 mb-2">
            옵션
          </div>
          <ToggleRow
            label="챕터 번호 표시"
            checked={options.showChapterNumber}
            onChange={(v) => onChangeOptions({ showChapterNumber: v })}
          />
          <ToggleRow
            label="시리즈명 표시"
            checked={options.showSeriesName}
            onChange={(v) => onChangeOptions({ showSeriesName: v })}
          />
          <ToggleRow
            label="영문 제목 병기"
            checked={options.showEnglishTitle}
            onChange={(v) => onChangeOptions({ showEnglishTitle: v })}
          />
          <ToggleRow
            label="ISBN 포함"
            checked={options.includeISBN}
            onChange={(v) => onChangeOptions({ includeISBN: v })}
          />
          <PillGroup
            label="간지 스타일"
            value={options.interludeStyle}
            options={[
              { value: "1p", label: "1p" },
              { value: "2p", label: "2p" },
            ]}
            onChange={(v) => onChangeOptions({ interludeStyle: v })}
          />

          {/* 고급 설정 아코디언 */}
          <button
            type="button"
            onClick={() => setAdvancedOpen((p) => !p)}
            className="w-full mt-3 flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-[0.7px] py-1 hover:text-text-secondary transition-colors"
          >
            <span>조판 · 고급</span>
            <span className="text-[10px]">{advancedOpen ? "▾" : "▸"}</span>
          </button>

          {advancedOpen && (
            <div className="pt-1">
              <PillGroup
                label="본문 폰트"
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
              <ToggleRow
                label="쪽번호 표시"
                checked={options.showPageNumber}
                onChange={(v) => onChangeOptions({ showPageNumber: v })}
              />
              <PillGroup
                label="쪽번호 위치"
                value={options.pageNumberPosition}
                options={[
                  { value: "bottom-outside", label: "밖↓" },
                  { value: "bottom-center", label: "중↓" },
                  { value: "top-outside", label: "밖↑" },
                ]}
                onChange={(v) => onChangeOptions({ pageNumberPosition: v })}
              />
              <ToggleRow
                label="챕터 시작 쪽번호 숨김"
                checked={options.hideChapterStartPageNumber}
                onChange={(v) => onChangeOptions({ hideChapterStartPageNumber: v })}
              />

              {/* 챕터 스타일 */}
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.7px] mt-3 mb-2">
                챕터 스타일
              </div>
              <ToggleRow
                label="드롭 캡 (첫 글자 장식)"
                checked={options.dropCaps}
                onChange={(v) => onChangeOptions({ dropCaps: v })}
              />
              <PillGroup
                label="장면 전환 구분자"
                value={options.sceneBreakStyle}
                options={[
                  { value: "asterisk", label: "* * *" },
                  { value: "line", label: "───" },
                  { value: "none", label: "없음" },
                ]}
                onChange={(v) => onChangeOptions({ sceneBreakStyle: v })}
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
  isActive = false,
  onSelect,
}: {
  block: BookBlock;
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

  // 섹션별 색상 도트
  const dotColor = isChapter
    ? "bg-accent"
    : isInterlude
    ? "bg-purple"
    : meta.section === "front"
    ? "bg-[#F59E0B]"
    : "bg-[#10B981]";

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
              {block.chapterNum}
              {block.title ? ` — ${block.title}` : ""}
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
              {meta.section === "front" ? "앞부분" : "뒷부분"} · {meta.label}
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

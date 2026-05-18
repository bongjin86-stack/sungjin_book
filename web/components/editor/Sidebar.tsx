"use client";

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
import type { BookBlock, BookOptions } from "@/types/book";

interface SidebarProps {
  options: BookOptions;
  onChangeOptions: (patch: Partial<BookOptions>) => void;
  blocks: BookBlock[];
  onReorder: (next: BookBlock[]) => void;
  onAddInterlude: () => void;
}

export function Sidebar({
  options,
  onChangeOptions,
  blocks,
  onReorder,
  onAddInterlude,
}: SidebarProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

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
    <aside className="w-[260px] bg-sidebar-bg border-r border-border flex flex-col flex-shrink-0 overflow-hidden">
      {/* Options */}
      <div className="px-3 pt-3 pb-[10px] border-b border-border flex-shrink-0">
        <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.7px] mb-2">
          옵션
        </div>
        <ToggleRow
          label="챕터 번호 표시"
          checked={options.showChapterNumber}
          onChange={(v) => onChangeOptions({ showChapterNumber: v })}
        />
        <ToggleRow
          label="미리보기 패널"
          checked={options.showPreviewPanel}
          onChange={(v) => onChangeOptions({ showPreviewPanel: v })}
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
        <div className="flex items-center justify-between py-1">
          <span className="text-[12px] text-text-secondary">간지 스타일</span>
          <div className="flex gap-1">
            {(["1p", "2p"] as const).map((s) => {
              const active = options.interludeStyle === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onChangeOptions({ interludeStyle: s })}
                  className={`px-[9px] py-[3px] rounded-[20px] text-[11px] font-medium border-[1.5px] transition-all ${
                    active
                      ? "border-purple bg-purple-light text-purple"
                      : "border-border bg-transparent text-text-muted"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* TOC */}
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
                {blocks.map((b) => (
                  <SortableTocItem key={b.id} block={b} />
                ))}
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
    </aside>
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

function SortableTocItem({ block }: { block: BookBlock }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  } as const;

  const isChapter = block.type === "chapter";

  // TODO: Phase 2 — 목차 항목 클릭 시 해당 챕터로 에디터 포커스 이동
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-2 px-2 py-[7px] rounded-[7px] cursor-pointer transition-colors hover:bg-border mb-px"
    >
      <span
        className={`w-[6px] h-[6px] rounded-full flex-shrink-0 ${
          isChapter ? "bg-accent" : "bg-purple"
        }`}
      />
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
        ) : (
          <>
            <div className="text-[12px] text-text-primary">간지</div>
            <div className="text-[10px] text-text-muted mt-px">간지 · 드래그로 위치 조정</div>
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

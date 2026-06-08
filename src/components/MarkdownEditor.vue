<script setup>
import { computed, ref, watch } from "vue";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "@tiptap/markdown";
import {
  Bold,
  Code2,
  Italic,
  Link,
  List,
  ListOrdered,
  Redo2,
  Undo2,
  Unlink
} from "lucide-vue-next";

const props = defineProps({
  modelValue: {
    type: String,
    default: ""
  },
  rows: {
    type: Number,
    default: 5
  },
  placeholder: {
    type: String,
    default: "支持 Markdown，例如 **加粗**、- 列表、[链接](https://example.com)"
  }
});

const emit = defineEmits(["update:modelValue"]);
const editorStateVersion = ref(0);
const lastSyncedMarkdown = ref(props.modelValue || "");

const editorMinHeight = computed(() => ({
  "--markdown-editor-min-height": `${Math.max(118, props.rows * 28)}px`
}));

const editor = useEditor({
  content: props.modelValue || "",
  contentType: "markdown",
  extensions: [
    StarterKit.configure({
      blockquote: false,
      codeBlock: false,
      heading: false,
      horizontalRule: false,
      link: {
        autolink: true,
        defaultProtocol: "https",
        linkOnPaste: true,
        openOnClick: false
      }
    }),
    Placeholder.configure({
      placeholder: props.placeholder
    }),
    Markdown.configure({
      indentation: {
        style: "space",
        size: 2
      }
    })
  ],
  editorProps: {
    attributes: {
      "aria-label": "Markdown 内容编辑器",
      class: "markdown-prosemirror"
    }
  },
  onSelectionUpdate: bumpEditorState,
  onTransaction: bumpEditorState,
  onUpdate: ({ editor: currentEditor }) => {
    bumpEditorState();
    const nextMarkdown = currentEditor.getMarkdown();
    lastSyncedMarkdown.value = nextMarkdown;
    emit("update:modelValue", nextMarkdown);
  }
});

watch(
  () => props.modelValue,
  (value) => {
    const currentEditor = editor.value;
    const nextMarkdown = value || "";
    if (!currentEditor) {
      lastSyncedMarkdown.value = nextMarkdown;
      return;
    }

    if (nextMarkdown === lastSyncedMarkdown.value || currentEditor.getMarkdown() === nextMarkdown) {
      lastSyncedMarkdown.value = nextMarkdown;
      return;
    }

    lastSyncedMarkdown.value = nextMarkdown;
    currentEditor.commands.setContent(nextMarkdown, {
      contentType: "markdown",
      emitUpdate: false
    });
  }
);

const toolbarItems = computed(() => [
  {
    key: "undo",
    label: "撤销",
    icon: Undo2,
    isActive: false,
    isDisabled: !canRunCommand("undo"),
    run: () => editor.value?.chain().focus().undo().run()
  },
  {
    key: "redo",
    label: "重做",
    icon: Redo2,
    isActive: false,
    isDisabled: !canRunCommand("redo"),
    run: () => editor.value?.chain().focus().redo().run()
  },
  {
    key: "bold",
    label: "加粗",
    icon: Bold,
    isActive: isActive("bold"),
    isDisabled: !canRunCommand("toggleBold"),
    run: () => editor.value?.chain().focus().toggleBold().run()
  },
  {
    key: "italic",
    label: "斜体",
    icon: Italic,
    isActive: isActive("italic"),
    isDisabled: !canRunCommand("toggleItalic"),
    run: () => editor.value?.chain().focus().toggleItalic().run()
  },
  {
    key: "bullet-list",
    label: "无序列表",
    icon: List,
    isActive: isActive("bulletList"),
    isDisabled: !canRunCommand("toggleBulletList"),
    run: () => editor.value?.chain().focus().toggleBulletList().run()
  },
  {
    key: "ordered-list",
    label: "有序列表",
    icon: ListOrdered,
    isActive: isActive("orderedList"),
    isDisabled: !canRunCommand("toggleOrderedList"),
    run: () => editor.value?.chain().focus().toggleOrderedList().run()
  },
  {
    key: "link",
    label: "链接",
    icon: Link,
    isActive: isActive("link"),
    isDisabled: !editor.value,
    run: setLink
  },
  {
    key: "unlink",
    label: "移除链接",
    icon: Unlink,
    isActive: false,
    isDisabled: !isActive("link"),
    run: () => editor.value?.chain().focus().unsetLink().run()
  },
  {
    key: "code",
    label: "行内代码",
    icon: Code2,
    isActive: isActive("code"),
    isDisabled: !canRunCommand("toggleCode"),
    run: () => editor.value?.chain().focus().toggleCode().run()
  }
]);

function canRunCommand(command) {
  const currentEditor = editor.value;
  editorStateVersion.value;
  if (!currentEditor) return false;

  const canCommands = currentEditor.can();
  return typeof canCommands[command] === "function" && canCommands[command]();
}

function isActive(name) {
  editorStateVersion.value;
  return Boolean(editor.value?.isActive(name));
}

function bumpEditorState() {
  editorStateVersion.value += 1;
}

function setLink() {
  const currentEditor = editor.value;
  if (!currentEditor) return;

  const previousUrl = currentEditor.getAttributes("link").href || "";
  const url = window.prompt("链接地址", previousUrl);
  if (url === null) return;

  if (!url.trim()) {
    currentEditor.chain().focus().unsetLink().run();
    return;
  }

  currentEditor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
}
</script>

<template>
  <div class="markdown-editor" :style="editorMinHeight">
    <div class="markdown-toolbar" aria-label="Markdown 格式工具栏">
      <button
        v-for="item in toolbarItems"
        :key="item.key"
        class="icon-button"
        :class="{ active: item.isActive }"
        type="button"
        :aria-label="item.label"
        :aria-pressed="item.isActive ? 'true' : 'false'"
        :disabled="item.isDisabled"
        :title="item.label"
        @click="item.run"
      >
        <component :is="item.icon" />
      </button>
    </div>
    <EditorContent :editor="editor" class="markdown-editor-surface" />
  </div>
</template>

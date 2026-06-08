<script setup>
import { ElButton, ElDialog, ElInput, ElOption, ElSelect } from "element-plus";

defineProps({
  customModuleDialog: {
    type: Object,
    required: true
  },
  customModulePresets: {
    type: Array,
    required: true
  }
});

defineEmits(["preset-change", "add"]);
</script>

<template>
  <ElDialog v-model="customModuleDialog.visible" title="新增模块" width="420px" :teleported="false">
    <div class="element-form-stack">
      <label>
        模块类型
        <ElSelect v-model="customModuleDialog.preset" @change="$emit('preset-change', $event)">
          <ElOption
            v-for="preset in customModulePresets"
            :key="preset.value"
            :label="preset.label"
            :value="preset.value"
          />
        </ElSelect>
      </label>
      <label>
        模块名称
        <ElInput v-model="customModuleDialog.title" placeholder="例如：工作经历 / 荣誉奖项 / 证书资质" />
      </label>
    </div>
    <template #footer>
      <ElButton @click="customModuleDialog.visible = false">取消</ElButton>
      <ElButton type="primary" @click="$emit('add')">新增</ElButton>
    </template>
  </ElDialog>
</template>

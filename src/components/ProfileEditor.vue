<script setup>
import { Image as ImageIcon, Trash2 } from "lucide-vue-next";

defineProps({
  profile: {
    type: Object,
    required: true
  },
  genderOptions: {
    type: Array,
    required: true
  },
  politicalStatusOptions: {
    type: Array,
    required: true
  },
  photoModes: {
    type: Array,
    required: true
  }
});

defineEmits(["photo-change", "remove-photo"]);
</script>

<template>
  <section class="form-section" aria-labelledby="basicTitle">
    <div class="section-heading">
      <h2 id="basicTitle">基本信息</h2>
    </div>
    <div class="field-grid basic-info-grid">
      <label>
        姓名
        <input v-model="profile.name" type="text" autocomplete="name" />
      </label>
      <label>
        求职方向
        <input v-model="profile.role" type="text" />
      </label>
      <label>
        电话
        <input v-model="profile.phone" type="tel" autocomplete="tel" />
      </label>
      <label>
        邮箱
        <input v-model="profile.email" type="email" autocomplete="email" />
      </label>
      <label>
        城市
        <input v-model="profile.location" type="text" autocomplete="address-level2" />
      </label>
      <label>
        性别
        <select v-model="profile.gender">
          <option v-for="option in genderOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
      <label>
        政治面貌
        <select v-model="profile.politicalStatus">
          <option v-for="option in politicalStatusOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
      <label>
        作品集 / 链接
        <input v-model="profile.website" type="text" />
      </label>
    </div>
    <div class="photo-controls">
      <label class="file-drop photo-drop">
        <ImageIcon />
        <span>{{ profile.photo.dataUrl ? "更换照片" : "上传照片" }}</span>
        <input accept="image/*" type="file" @change="$emit('photo-change', $event)" />
      </label>
      <label>
        照片样式
        <select v-model="profile.photo.mode">
          <option v-for="mode in photoModes" :key="mode.value" :value="mode.value">
            {{ mode.label }}
          </option>
        </select>
      </label>
      <button class="ghost-button" type="button" :disabled="!profile.photo.dataUrl" @click="$emit('remove-photo')">
        <Trash2 />
        移除照片
      </button>
    </div>
  </section>
</template>

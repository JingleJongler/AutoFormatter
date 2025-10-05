// js/components/fileList.js
export const FileList = {
    props: ['files'],
    template: `
    <div class="d-flex flex-wrap gap-2">
      <v-btn
        v-for="(file, index) in files"
        :key="index"
        class="btn px-2 m-1"
        @click="$emit('file-clicked', file)"
      >
        {{ file.name }}
      </v-btn>
    </div>
  `
};
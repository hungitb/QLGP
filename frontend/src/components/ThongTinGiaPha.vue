<template>
  <v-card>
    <v-card-title>Thông tin gia phả</v-card-title>
    <v-card-text>
      <v-simple-table>
        <tbody>
          <tr>
            <th>item.name</th>
            <td>item.calories</td>
          </tr>
          <tr>
            <th>item.name</th>
            <td>item.calories</td>
          </tr>
        </tbody>
      </v-simple-table>
    </v-card-text>
    <v-card-actions v-if="canWrite()">
      <v-btn text color="primary">Chỉnh sửa</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { permissionMixin } from "@/utils";
import { defineComponent } from "vue";

export default defineComponent({
  mixins: [permissionMixin],
});
</script>

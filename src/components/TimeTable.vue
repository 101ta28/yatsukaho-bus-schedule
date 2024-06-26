<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="12" sm="10" md="8">
        <v-row class="mb-4 text-center">
          <v-col cols="12" md="12" class="text-subtitle-1">{{ currentDirection }}</v-col>
          <v-col cols="12" md="6">
            <v-btn @click="switchDirection" color="primary">行き先を切り替え</v-btn>
          </v-col>
          <v-col cols="12" md="6">
            <v-btn @click="dialog = true" color="secondary">日付を選択</v-btn>
            <v-dialog v-model="dialog" max-width="400px">
              <v-locale-provider locale="ja">
                <v-date-picker title="日付を選択" v-model="selectedDate" @input="dialog = false"></v-date-picker>
              </v-locale-provider>
            </v-dialog>
          </v-col>
          <v-col cols="12" md="12">
            <v-select v-model="selectedStopName" :items="stopNames" label="号館を選択"></v-select>
          </v-col>
        </v-row>
        <v-card class="pa-3" elevation="2" v-if="selectedStopName">
          <v-card-title class="text-center text-body-1">{{ currentDirection }} - {{ selectedStopName }}</v-card-title>
          <v-card-text>
            <v-row no-gutters justify="center">
              <!-- 選択された停留所の時刻表示 -->
              <v-col class="text-center">
                <div class="text-subtitle-2 mb-2">{{ selectedStopName }}</div>
                <div v-if="times.board_times.length > 0">
                  <div class="text-caption mb-2">乗車のみ</div>
                  <div v-for="time in times.board_times" :key="`depart-${selectedStopName}-${time}`">
                    <v-chip class="mb-2">{{ time }}</v-chip>
                  </div>
                </div>
                <div v-if="times.exit_times.length > 0">
                  <div class="text-caption mb-2">降車のみ</div>
                  <div v-for="time in times.exit_times" :key="`arrive-${selectedStopName}-${time}`">
                    <v-chip class="mb-2">{{ time }}</v-chip>
                  </div>
                </div>
              </v-col>
              <!-- 残りの停留所の時刻表示 -->
              <v-col v-for="stop in remainingStops" :key="stop.name" class="text-center">
                <div class="text-subtitle-1 mb-2">{{ stop.name }}</div>
                <div v-if="stop.board_times.length > 0">
                  <div class="text-caption mb-2">乗車のみ</div>
                  <div v-for="time in stop.board_times" :key="`depart-${stop.name}-${time}`">
                    <v-chip class="mb-2">{{ time }}</v-chip>
                  </div>
                </div>
                <div v-if="stop.exit_times.length > 0">
                  <div class="text-caption mb-2">降車のみ</div>
                  <div v-for="time in stop.exit_times" :key="`arrive-${stop.name}-${time}`">
                    <v-chip class="mb-2">{{ time }}</v-chip>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>


<script setup>
import axios from 'axios';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { computed, ref, watch } from 'vue';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const dialog = ref(false);
const selectedDate = ref(dayjs().format('YYYY-MM-DD'));
const routes = ref([]);
const directionIndex = ref(0);
const selectedStopName = ref("");
const remainingStops = ref([]);
const times = ref({ board_times: [], exit_times: [] });

// スケジュールJSONデータの取得
const fetchRoutes = async () => {
  try {
    const { data } = await axios.get('schedule.json');
    routes.value = data.routes;
  } catch (error) {
    console.error("Failed to load routes data:", error);
  }
};

fetchRoutes();

const switchDirection = () => {
  directionIndex.value = (directionIndex.value + 1) % routes.value.length;
  updateTimetable();
};

const currentDirection = computed(() => {
  return routes.value[directionIndex.value]?.direction || "";
});

const selectedRoute = computed(() => routes.value[directionIndex.value]);

const stopNames = computed(() => {
  return selectedRoute.value ? selectedRoute.value.weekdays.stops.map(stop => stop.name) : [];
});

// 休暇期間中かどうかを確認する関数
const isInVacationPeriod = (date, periods) => {
  return periods.some(period =>
    dayjs(date).isSameOrAfter(dayjs(period.start_date)) && dayjs(date).isSameOrBefore(dayjs(period.end_date))
  );
};

const updateTimetable = () => {
  if (!routes.value.length || !selectedStopName.value) {
    times.value = { board_times: [], exit_times: [] };
    remainingStops.value = [];
    return;
  }

  const dayOfWeek = dayjs(selectedDate.value).day();
  const selectedDayType = dayOfWeek >= 1 && dayOfWeek <= 5 ? "weekdays" : "saturdays";

  // 休暇期間を判断
  const selectedRouteData = routes.value.find(route => route.direction === currentDirection.value);
  if (!selectedRouteData) return;
  const isVacation = isInVacationPeriod(selectedDate.value, selectedRouteData.validity.vacation_periods);
  const scheduleType = isVacation ? `vacation_${selectedDayType}` : selectedDayType;

  // 選択された停留所の時刻を更新
  const selectedStopData = selectedRouteData[scheduleType].stops.find(stop => stop.name === selectedStopName.value);
  times.value = {
    board_times: selectedStopData ? selectedStopData.board_times || [] : [],
    exit_times: selectedStopData ? selectedStopData.exit_times || [] : [],
  };

  // 選択されていない停留所の情報を更新
  remainingStops.value = selectedRouteData[scheduleType].stops
    .filter(stop => stop.name !== selectedStopName.value)
    .map(stop => ({
      name: stop.name,
      board_times: stop.board_times || [],
      exit_times: stop.exit_times || [],
    }));
};

watch([selectedStopName, directionIndex, selectedDate], updateTimetable, { immediate: true });
</script>

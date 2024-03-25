<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="12" sm="10" md="8">
        <v-row class="mb-4 text-center">
          <v-col cols="12" md="12" class="text-subtitle-1">{{ currentDirection }}</v-col>
          <v-col cols="12" md="12">
            <v-btn @click="switchDirection" color="primary">行き先を切り替え</v-btn>
          </v-col>
          <v-col cols="12" md="12">
            <v-select v-model="selectedStopName" :items="stopNames" label="号館を選択"></v-select>
          </v-col>
        </v-row>
        <v-card class="pa-3" elevation="2" v-if="selectedStopName">
          <v-card-title class="text-center text-body-1">{{ selectedRoute.direction }} - {{ selectedStopName
            }}</v-card-title>
          <v-card-text>
            <v-row no-gutters justify="center">
              <!-- 選択された停留所の時刻表示 -->
              <v-col class="text-center">
                <div class="text-subtitle-2 mb-2">{{ selectedStopName }}</div>
                <div v-if="departureTimes.length > 0">
                  <div class="text-caption mb-2">出発時間</div>
                  <div v-for="time in departureTimes" :key="`depart-${selectedStopName}-${time}`"
                    :class="getTimeClass(time, selectedStopName)">
                    <v-chip class="mb-2">{{ time }}</v-chip>
                  </div>
                </div>
                <div v-if="arrivalTimes.length > 0">
                  <div class="text-caption2 mb-2">到着時間</div>
                  <div v-for="time in arrivalTimes" :key="`arrive-${selectedStopName}-${time}`"
                    :class="getTimeClass(time, selectedStopName)">
                    <v-chip class="mb-2">{{ time }}</v-chip>
                  </div>
                </div>
              </v-col>
              <!-- 残りの停留所の時刻表示 -->
              <v-col v-for="stop in remainingStops" :key="stop.name" class="text-center">
                <div class="text-subtitle-2 mb-2">{{ stop.name }}</div>
                <div v-if="stop.departureTimes.length > 0">
                  <div class="text-caption mb-2">出発時間</div>
                  <div v-for="time in stop.departureTimes" :key="`depart-${stop.name}-${time}`"
                    :class="getTimeClass(time, stop.name)">
                    <v-chip class="mb-2">{{ time }}</v-chip>
                  </div>
                </div>
                <div v-if="stop.arrivalTimes.length > 0">
                  <div class="text-caption mb-2">到着時間</div>
                  <div v-for="time in stop.arrivalTimes" :key="`arrive-${stop.name}-${time}`"
                    :class="getTimeClass(time, stop.name)">
                    <v-chip class="mb-2">{{ time }}</v-chip>
                  </div>
                </div>
              </v-col>
              <!-- 残りの停留所の時刻表示 -->
              <!-- <v-col cols="12" sm="6" md="9" class="text-center">
                <v-row>
                  <v-col v-for="stop in remainingStops" :key="stop.name" class="text-center">
                    <div class="text-subtitle-2 mb-2">{{ stop.name }}</div>
                    <div v-if="stop.departureTimes.length > 0">
                      <div class="text-caption mb-2">出発時間</div>
                      <div v-for="time in stop.departureTimes" :key="`depart-${stop.name}-${time}`"
                        :class="getTimeClass(time, stop.name)">
                        <v-chip class="mb-2">{{ time }}</v-chip>
                      </div>
                    </div>
                    <div v-if="stop.arrivalTimes.length > 0">
                      <div class="text-caption mb-2">到着時間</div>
                      <div v-for="time in stop.arrivalTimes" :key="`arrive-${stop.name}-${time}`"
                        :class="getTimeClass(time, stop.name)">
                        <v-chip class="mb-2">{{ time }}</v-chip>
                      </div>
                    </div>
                  </v-col>
                </v-row>
              </v-col> -->
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
import { computed, ref, watch } from 'vue';

const routes = ref([]);
const directionIndex = ref(0);
const selectedStopName = ref("");
const departureTimes = ref([]); // 選択された停留所の出発時間
const arrivalTimes = ref([]); // 選択された停留所の到着時間
const remainingStops = ref([]); // その他の停留所の情報（出発時間と到着時間を含む）

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

const updateTimetable = () => {
  if (!selectedRoute.value) return;
  const selectedStop = selectedRoute.value.weekdays.stops.find(stop => stop.name === selectedStopName.value);
  departureTimes.value = selectedStop ? selectedStop.board_times : [];
  arrivalTimes.value = selectedStop ? selectedStop.exit_times : [];

  remainingStops.value = selectedRoute.value.weekdays.stops.filter(stop => stop.name !== selectedStopName.value).map(stop => ({
    name: stop.name,
    departureTimes: stop.board_times,
    arrivalTimes: stop.exit_times
  }));
};

watch([selectedStopName, directionIndex], updateTimetable);

// 現在時刻から最も近い未来の時刻を特定し、その時刻に基づいてクラスを適用するための関数
function getTimeClass(time, stopName) {
  const currentTime = dayjs();
  const parsedTime = dayjs(`${currentTime.format('YYYY-MM-DD')} ${time}`);

  if (parsedTime.isBefore(currentTime)) {
    return 'text-grey';
  }

  // 各停留所の次の時刻を取得するための関数
  const getNextTimeForStop = (times) => {
    return times
      .map(t => dayjs(`${currentTime.format('YYYY-MM-DD')} ${t}`))
      .filter(t => t.isAfter(currentTime))
      .sort((a, b) => a.diff(b))[0];
  };

  let times;
  if (stopName === selectedStopName.value) {
    times = [...departureTimes.value, ...arrivalTimes.value];
  } else {
    const stop = remainingStops.value.find(s => s.name === stopName);
    times = stop ? [...stop.departureTimes, ...stop.arrivalTimes] : [];
  }

  const nextTime = getNextTimeForStop(times);
  if (nextTime && nextTime.format('HH:mm') === time) {
    return 'text-orange';
  }

  return '';
}
</script>
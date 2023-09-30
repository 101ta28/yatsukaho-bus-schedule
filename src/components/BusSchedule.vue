<template>
  <div class="pa-3">
    <!-- Direction Display and Toggle Button -->
    <v-row class="mb-3" justify="center" align="center">
      <v-col cols="12" md="6" class="text-center">
        <div class="mb-2">{{ currentDirection }}</div>
        <v-btn @click="toggleDirection" color="primary">切り替え</v-btn>
      </v-col>
    </v-row>

    <!-- Building Dropdown -->
    <v-row class="mb-3" justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-select :items="allStops" label="号館選択" v-model="selectedStopName" outlined dense></v-select>
      </v-col>
    </v-row>

    <!-- Times for Selected Building -->
    <v-row v-if="selectedStopName" justify="center">
      <v-col cols="12" sm="10" md="8" lg="6" class="mb-4">
        <!-- Upcoming Times Card -->
        <v-card class="mb-2">
          <v-card-title class="blue-grey darken-1 white--text">{{ selectedStopName }} {{ selectedStopType ===
            "exit_only" ? "(降車のみ)" : selectedStopType === "board_only" ? "(乗車のみ)" : "" }}</v-card-title>
          <v-divider></v-divider>
          <div class="times-list" ref="timesList">
            <v-card v-for="time in upcomingTimes" :key="time" class="my-1"
              :color="isNextTime(time) ? 'cyan lighten-4' : ''">
              <v-card-text class="text-center">{{ time }}</v-card-text>
            </v-card>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="10" md="8" lg="6">
        <!-- Departed Times Card -->
        <v-card v-if="departedTimes.length" class="mb-2">
          <v-card-title class="blue-grey darken-1 white--text">{{ selectedStopType ===
            "exit_only" ? "到着済み" : selectedStopType === "board_only" ? "出発済み" : "" }}- {{ selectedStopName
  }}</v-card-title>
          <v-divider></v-divider>
          <div>
            <v-card v-for="time in departedTimes" :key="time" class="my-1">
              <v-card-text class="text-center">{{ time }}</v-card-text>
            </v-card>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import data from '/src/data.json';

const currentDayType = ref(getCurrentDayType());
const currentScheduleType = ref(getCurrentScheduleType());
const allDirections = computed(() => Object.keys(data[currentScheduleType.value][currentDayType.value].directions));
const currentDirectionIndex = ref(0);
const currentDirection = computed(() => allDirections.value[currentDirectionIndex.value]);
const allStops = computed(() => data.schedule[currentDayType.value].directions[currentDirection.value].stops.map(stop => stop.name));
const selectedStopName = ref(null);
const timesList = ref(null);

function getCurrentDayType() {
  const dayOfWeek = new Date().getDay();
  console.log(dayOfWeek);
  if (dayOfWeek === 6) { // Saturday
    return "saturdays";
  } else { // This includes both normal weekdays and Sunday.
    return "weekdays";
  }
}

function getCurrentScheduleType() {
  const currentDate = new Date();
  const startDate = new Date(data.schedule.validity.start_date);
  const endDate = new Date(data.schedule.validity.end_date);
  if (currentDate >= startDate && currentDate <= endDate) {
    return "schedule";
  } else {
    return "vacation_schedule";
  }
}

const getTimesForStop = (stopName) => {
  const stopData = data[currentScheduleType.value][currentDayType.value].directions[currentDirection.value].stops.find(stop => stop.name === stopName);
  if (!stopData) return [];

  const currentTime = new Date();
  const sortedTimes = stopData.times.sort((a, b) => {
    const [ah, am] = a.split(":").map(Number);
    const [bh, bm] = b.split(":").map(Number);
    const dateA = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), ah, am);
    const dateB = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), bh, bm);
    if (currentTime <= dateA && currentTime > dateB) return -1;
    if (currentTime > dateA && currentTime <= dateB) return 1;
    return dateA - dateB;
  });

  return sortedTimes;
};

const toggleDirection = () => {
  currentDirectionIndex.value = 1 - currentDirectionIndex.value;
};

const selectedStopType = computed(() => {
  const stopData = data[currentScheduleType.value][currentDayType.value].directions[currentDirection.value].stops.find(stop => stop.name === selectedStopName.value);
  return stopData ? stopData.type : null;
});

const nextTime = computed(() => {
  const currentTime = new Date();
  const times = getTimesForStop(selectedStopName.value);
  for (let time of times) {
    const [hour, minute] = time.split(":").map(Number);
    const timeDate = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), hour, minute);
    if (currentTime <= timeDate) {
      return time;
    }
  }
  return null;
});

const isNextTime = (time) => {
  return time === nextTime.value;
};

const departedTimes = computed(() => {
  return getTimesForStop(selectedStopName.value).filter(time => !isUpcomingTime(time));
});

const upcomingTimes = computed(() => {
  return getTimesForStop(selectedStopName.value).filter(isUpcomingTime);
});

const isUpcomingTime = (time) => {
  const currentTime = new Date();
  const [hour, minute] = time.split(":").map(Number);
  const timeDate = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), hour, minute);
  return currentTime <= timeDate;
};

watch(selectedStopName, () => {
  nextTick(() => {
    const index = getTimesForStop(selectedStopName.value).indexOf(nextTime.value);
    if (index !== -1) {
      const listItemHeight = 60;  // カードの高さ (v-card-text + margin)
      const scrollPosition = index * listItemHeight;
      if (timesList.value) {
        timesList.value.scrollTop = scrollPosition;
      }
    }
  });
});
</script>

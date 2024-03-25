<template>
	<v-app-bar app :elevation="0">
		<v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
		<v-toolbar-title>やつかほバス時刻表</v-toolbar-title>
	</v-app-bar>
	<v-navigation-drawer v-model="drawer" app>
		<v-list>
			<v-list-item v-for="(item, index) in items" :key="index" @click="navigateTo(item.routeName)">
				<v-icon>{{ item.icon }}</v-icon>
				<v-list-item-title>{{ item.title }}</v-list-item-title>
			</v-list-item>
		</v-list>
	</v-navigation-drawer>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const drawer = ref(false);
const items = ref([
	{ title: 'ホーム', icon: 'mdi-home', routeName: 'home' },
	{ title: '日付から検索', icon: 'mdi-clock', routeName: 'timetable' },
]);

const router = useRouter();

const navigateTo = (routeName) => {
	router.push({ name: routeName });
	drawer.value = false; // ナビゲーション後にドロワーを閉じる
};
</script>
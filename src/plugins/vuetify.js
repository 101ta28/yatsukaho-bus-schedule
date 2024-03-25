/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';

// Composables
import DayJsAdapter from '@date-io/dayjs';
import ja from 'dayjs/locale/ja';
import { createVuetify } from 'vuetify';

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
const dayjs = new DayJsAdapter({ locale: ja });

export default createVuetify({
  date: {
    adapter: dayjs,
    locale: {
      ja
    }
  },
  theme: {
    defaultTheme: 'light',
  },
})

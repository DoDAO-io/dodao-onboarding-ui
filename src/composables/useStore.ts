import { reactive } from 'vue';

const store = reactive({
  space: {
    proposals: [],
    guides: [],
    guideBundles: [],
    filterBy: 'all'
  },
  timeline: {
    proposals: [],
    guides: [],
    filterBy: 'all'
  }
});

export function useStore() {
  return { store };
}

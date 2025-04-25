// src/composables/useFieldRules.js

export const requiredRule = (label) => [(v) => !!v || `${label} is required`]

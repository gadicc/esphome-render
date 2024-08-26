const models: {
  [key: string]: { [key: string]: { width: number; height: number } };
} = {
  ili9xxx: {
    S3BOX: {
      width: 320,
      height: 240,
    },
  },
};

export function getModel(platform: string, model: string) {
  return models[platform][model];
}

const transformGcsUrl = (url: string) => {
  if (url.startsWith("gs://")) {
    return url.replace("gs://", "https://storage.cloud.google.com/");
  }
  return url;
};

export { transformGcsUrl };

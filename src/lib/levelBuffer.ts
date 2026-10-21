/** Raise a quiet recording toward `target` peak. Loud files are left untouched. */
export function levelBuffer(buffer: AudioBuffer, target = 0.8, ceiling = 64) {
  let peak = 0.0001;
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let index = 0; index < data.length; index += 1) {
      peak = Math.max(peak, Math.abs(data[index]));
    }
  }
  const gain = Math.min(ceiling, target / peak);
  if (gain <= 1.05) return;
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let index = 0; index < data.length; index += 1) data[index] *= gain;
  }
}

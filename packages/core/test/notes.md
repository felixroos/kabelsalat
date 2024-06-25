# sox / ffmpeg experiments

```sh
# play samples rendered by node script
node play.mjs | sox -traw -r44100 -b32 -e float - -tcoreaudio
node play.mjs | ffplay -f f32le -ar 44100 -nodisp -autoexit -
# limit to 10 seconds
node play.mjs 10 | sox -traw -r44100 -b32 -e float - -tcoreaudio
node play.mjs | ffplay -f f32le -ar 44100 -nodisp -autoexit -

# dump 10s of audio to wav file
rm output.wav && node play.mjs 10 | sox -traw -r44100 -b32 -e float - -t wav output.wav
rm output.wav && node play.mjs 10 | ffmpeg -f f32le -ar 44100 -i - -c:a pcm_f32le output.wav


# render waveform
ffmpeg -i output.wav -lavfi showspectrumpic=s=hd480:legend=disabled spectrogram.png
ffmpeg -i output.wav -filter_complex showwavespic=s=1280x720 waveform.png

# compile node script to standalone script
bun build ./play.mjs --compile --outfile salat
# dump 10s of raw samples to pcm file
node play.mjs 10 > out.pcm
# play pcm file
cat out.pcm | sox -traw -r44100 -b32 -e float - -tcoreaudio
cat out.pcm  | ffplay -f f32le -ar 44100 -nodisp -autoexit -
```

## combos

```sh
# render waveform directly
node play.mjs 10 | ffmpeg -f f32le -ar 44100 -i - -filter_complex showwavespic=s=1280x720 -frames:v 1 waveform.png -y
#
node play.mjs 0.2 | ffmpeg -f f32le -ar 44100 -i - -filter_complex showwavespic=s=1280x720:colors=yellow:draw=full waveform.png -y

# waveform video
rm output.mp4 && node play.mjs 10 | ffmpeg -f f32le -ar 44100 -i - -filter_complex "[0:a]compand,showwaves=size=854x480:colors=yellow:draw=full:mode=p2p,format=yuv420p[vout]" -map "[vout]" -r 25 -map 0:a -c:v libx264 -c:a copy output.mp4 -y
```

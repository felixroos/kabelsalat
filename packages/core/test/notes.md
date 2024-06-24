# sox / ffmpeg experiments

```sh
# play samples rendered by node script
node play.mjs | sox -traw -r44100 -b32 -e float - -tcoreaudio
node play.mjs | ffplay -f f32le -ar 44100 -nodisp -autoexit -
# limit to 10 seconds
node play.mjs 10 | sox -traw -r44100 -b32 -e float - -tcoreaudio
node play.mjs | ffplay -f f32le -ar 44100 -nodisp -autoexit -

# dump 10s of audio to wav file
node play.mjs 10 | sox -traw -r44100 -b32 -e float - -t wav output.wav
node play.mjs 10 | ffmpeg -f f32le -ar 44100 -i - -c:a pcm_f32le output.wav

# compile node script to standalone script
bun build ./play.mjs --compile --outfile salat
# dump 10s of raw samples to pcm file
node play.mjs 10 > out.pcm
# play pcm file
cat out.pcm | sox -traw -r44100 -b32 -e float - -tcoreaudio
cat out.pcm  | ffplay -f f32le -ar 44100 -nodisp -autoexit -
```

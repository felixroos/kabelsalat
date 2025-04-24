# ks2sc

in this experiment, kabelsalat acts as a frontend for SuperCollider, generating sclang code. Assuming you have SuperCollider installed, and `sclang` is in your PATH (test by running `sclang` in a terminal), you can run the ks2c repl like this:

```sh
node ks2sc.js
```

now you can enter kabelsalat code, like:

```plaintext
saw(55).lpf(sine(2).add(1.5).mul(300))
```

this is the mapping from kabelsalat to sc ugens:

| ks       | sc                      | comment                                         |
| -------- | ----------------------- | ----------------------------------------------- |
| adsr     | EnvGen + Env.adsr       | attack phase will not finish when gate gets low |
| clock    |                         | use impulse for now                             |
| clockdiv | PulseDivider            |                                                 |
| delay    | Delay                   |                                                 |
| distort  | AnalogVintageDistortion | has more options..                              |
| hold     | Latch                   |                                                 |
| noise    | WhiteNoise              |                                                 |
| dust     | Dust                    |                                                 |
| brown    | BrownNoise              |                                                 |
| pink     | PinkNoise               |                                                 |
| impulse  | Impulse                 |                                                 |
| pulse    | LFPulse                 | between -1 and 1. will soon be bandlimited      |
| zaw      | LFSaw                   |                                                 |
| saw      | Saw                     |                                                 |
| sine     | SinOsc                  |                                                 |
| tri      | LFTri                   | no bandlimited Triangle in SuperCollider?       |
| lag      | Lag                     |                                                 |
| slew     | Slew                    |                                                 |
| slide    | Lag                     | not implemented in ks2sc                        |
| lpf      | RLPF                    | sc is in hz + res is different                  |
| bpf      | BPF                     | sounds very different                           |
| fold     | Fold                    | sounds slightly different                       |
| range    | (x+1)/2                 | assumes bipolar input                           |
| seq      | Dseq                    | wrapped with Demand                             |
| pick     | Select                  | ks uses dynamic arity                           |
| remap    | linlin                  |                                                 |
| clip     | Clip                    |                                                 |

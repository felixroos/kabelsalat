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

| ks           | sc                      | comment                                         |
| ------------ | ----------------------- | ----------------------------------------------- |
| [x] saw      | Saw                     |                                                 |
| [x] sine     | SinOsc                  |                                                 |
| [x] lpf      | RLPF                    | sc is in hz + res is different                  |
| [x] adsr     | EnvGen + Env.adsr       | attack phase will not finish when gate gets low |
| [ ] clock    |                         | use impulse for now                             |
| [ ] clockdiv |                         |                                                 |
| [x] delay    | Delay                   |                                                 |
| [x] distort  | AnalogVintageDistortion | has more options..                              |
| [x] hold     | Latch                   |                                                 |
| [x] noise    | WhiteNoise              |                                                 |
| [x] brown    | BrownNoise              |                                                 |

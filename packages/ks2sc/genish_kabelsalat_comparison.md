# genish / kabelsalat comparison

- [genish reference](https://www.charlie-roberts.com/genish/docs/index.html)
- [kabelsalat reference](https://kabel.salat.dev/reference/)

|  genish  | kabelsalat | comment                                                                                       |
| -------- | ---------- | --------------------------------------------------------------------------------------------- |
| accum    |            | [counter ugen](https://github.com/felixroos/kabelsalat/issues/67)                             |
| acos     | acos       |                                                                                               |
| ad       | ad         |                                                                                               |
| add      | add        |                                                                                               |
| adsr     | adsr       |                                                                                               |
| and      | and        |                                                                                               |
| asin     | asin       |                                                                                               |
| atan     | atan       |                                                                                               |
| bang     |            | [cc + setControls](https://github.com/felixroos/kabelsalat/issues/66)                         |
| bool     | bool       |                                                                                               |
| ceil     | ceil       |                                                                                               |
| clamp    | clamp      |                                                                                               |
| cos      | cos        |                                                                                               |
| counter  |            | [counter ugen](https://github.com/felixroos/kabelsalat/issues/67)                             |
| cycle    | sine       |                                                                                               |
| data     |            | tbd                                                                                           |
| dcblock  |            | tbd                                                                                           |
| delay    | delay      | kabelsalat delay is in seconds [see issue](https://github.com/felixroos/kabelsalat/issues/68) |
| div      | div        |                                                                                               |
| eq       | and        | should be same right?                                                                         |
| floor    | floor      |                                                                                               |
| fold     | fold       | kabelsalat fold seems more complex                                                            |
| gate     | pick?      |                                                                                               |
| gt       | greater    |                                                                                               |
| gtp      |            | tbd                                                                                           |
| history  |            | out/src or lambda feedback                                                                    |
| ifelse   | ifelse     | currently no dynamic arity                                                                    |
| input    | cc         | [doc issue](https://github.com/felixroos/kabelsalat/issues/69)                                |
| lt       | lower      |                                                                                               |
| ltp      |            | tbd                                                                                           |
| max      | max        |                                                                                               |
| min      | min        |                                                                                               |
| mod      | mod        |                                                                                               |
| mul      | mul        |                                                                                               |
| noise    | noise      |                                                                                               |
| not      | not        |                                                                                               |
| param    | cc         | [doc issue](https://github.com/felixroos/kabelsalat/issues/69)                                |
| peek     |            | tbd                                                                                           |
| phasor   | zaw        |                                                                                               |
| poke     |            | tbd                                                                                           |
| round    | round      |                                                                                               |
| selector | pick       |                                                                                               |
| sign     | sign       |                                                                                               |
| sin      | sin        |                                                                                               |
| slide    | slide/lag  |                                                                                               |
| sub      | sub        |                                                                                               |
| switch   | pick       |                                                                                               |
| t60      |            | tbd                                                                                           |
| tan      | tan        |                                                                                               |
| train    | pulse      |                                                                                               |
| wrap     |            | tbd                                                                                           |
|          | abs        |                                                                                               |
|          | ar         |                                                                                               |
|          | argmin     |                                                                                               |
|          | audioin    |                                                                                               |
|          | bipolar    |                                                                                               |
|          | bpf        |                                                                                               |
|          | brown      |                                                                                               |
|          | bytebeat   |                                                                                               |
|          | clip       |                                                                                               |
|          | clockdiv   |                                                                                               |
|          | debug      |                                                                                               |
|          | distort    |                                                                                               |
|          | dust       |                                                                                               |
|          | exp        |                                                                                               |
|          | floatbeat  |                                                                                               |
|          | fork       |                                                                                               |
|          | hold       |                                                                                               |
|          | hpf        |                                                                                               |
|          | impulse    |                                                                                               |
|          | lfnoise    |                                                                                               |
|          | lpf        |                                                                                               |
|          | map        |                                                                                               |
|          | midicc     |                                                                                               |
|          | midifreq   |                                                                                               |
|          | midigate   |                                                                                               |
|          | midinote   |                                                                                               |
|          | mix        |                                                                                               |
|          | mouseX     |                                                                                               |
|          | mouseY     |                                                                                               |
|          | or         |                                                                                               |
|          | pan        |                                                                                               |
|          | perc       |                                                                                               |
|          | pick       |                                                                                               |
|          | pink       |                                                                                               |
|          | pow        |                                                                                               |
|          | range      |                                                                                               |
|          | rangex     |                                                                                               |
|          | raw        |                                                                                               |
|          | register   |                                                                                               |
|          | remap      |                                                                                               |
|          | saw        |                                                                                               |
|          | select     |                                                                                               |
|          | seq        |                                                                                               |
|          | signal     |                                                                                               |
|          | slew       |                                                                                               |
|          | split      |                                                                                               |
|          | thru       |                                                                                               |
|          | time       |                                                                                               |
|          | tri        |                                                                                               |
|          | trig       |                                                                                               |
|          | unipolar   |                                                                                               |
|          | xor        |                                                                                               |

- add functions to convert seconds <-> samples

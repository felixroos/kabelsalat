# kabelsalat

very early experiment to live code audio graphs

compilation strategy / graph format very much inspired by and adapted from <https://noisecraft.app/>

## examples

- [am thing](https://felixroos.github.io/kabelsalat/#c2luZSgxMTApCi5tdWwoCiAgc2luZSgKICAgIG4oMzMyKS5tdWwoCiAgICAgIHNpbmUoLjAxKS5yYW5nZSguMjUsMikKICAgICkKICApCiAgLnJhbmdlKC4wNSwxKQopCi5tdWwoLjEpCi5vdXQoKQ==)
- [fm thing](https://felixroos.github.io/kabelsalat/#c2luZSgKbigxMTApLm11bCgKICBzaW5lKAogICAgbig2MzIpLm11bCgKICAgICAgc2F3KC4wMikucmFuZ2UoLjI1LDIpCiAgICApCiAgKQogIC5yYW5nZSguMDUsMSkKKSkKLm11bCguMSkKLm91dCgp)
- [fm thing 2](https://felixroos.github.io/kabelsalat/#c2luZSgKbigxMTApLm11bCgKICBzaW5lKAogICAgbigxMTUpLm11bCgKICAgICAgc2luZSgyNTApCiAgICAgIC5yYW5nZSguMTI1LCBzaW5lKC4wMikucmFuZ2UoMSwyMCkpCiAgICApCiAgKQogIC5yYW5nZSguMDUsMSkKKSkKLm11bCguMSkKLm91dCgp)
- [additive](https://felixroos.github.io/kabelsalat/#KCgpID0+IHsKbGV0IG9yZ2FuID0gKGZyZXEsIHBhcnRpYWxzKSA9PiB7CmxldCBzb3VuZCA9IG4oMCk7CmZvcihsZXQgaSA9IDE7aTw9cGFydGlhbHM7aSsrKSB7CmNvbnN0IHBhcnRpYWwgPSBzaW5lKGkqZnJlcSkubXVsKDEvaSkKc291bmQgPSBzb3VuZC5hZGQocGFydGlhbCkKfQpyZXR1cm4gc291bmQKfQoKcmV0dXJuIG9yZ2FuKDExMCwzKS5hZGQob3JnYW4oMTExLDUpKQoubXVsKC4xMjUpLm91dCgpCn0pKCk=)

## notable noisecraft changes

added `time` flag to `NODE_SCHEMA`, to denote that time should be passed as first arg to `update`.

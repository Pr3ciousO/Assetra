/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/assetra.json`.
 */
export type Assetra = {
  "address": "6GTtJo5knveEYPkgHxTdykFtzT4ftwrGBbcGZq8cyZ6r",
  "metadata": {
    "name": "assetra",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Assetra: pre-IPO index vault (Frontier Index) with on-chain Auto-Invest"
  },
  "docs": [
    "Assetra: fully backed, in-kind pre-IPO index tokens (Frontier Index) with",
    "on-chain Auto-Invest plans."
  ],
  "instructions": [
    {
      "name": "addComponent",
      "docs": [
        "Add a constituent: `units` base units backing 1 whole index token.",
        "Only allowed before any index tokens exist."
      ],
      "discriminator": [
        239,
        254,
        163,
        182,
        226,
        212,
        6,
        27
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "index"
          ]
        },
        {
          "name": "index",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  100,
                  101,
                  120
                ]
              },
              {
                "kind": "account",
                "path": "index.symbol",
                "account": "index"
              }
            ]
          }
        },
        {
          "name": "indexMint",
          "relations": [
            "index"
          ]
        },
        {
          "name": "componentMint"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "index"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "componentMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "units",
          "type": "u64"
        }
      ]
    },
    {
      "name": "buyWithUsdc",
      "discriminator": [
        33,
        209,
        211,
        124,
        55,
        142,
        122,
        212
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "index",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  100,
                  101,
                  120
                ]
              },
              {
                "kind": "account",
                "path": "index.symbol",
                "account": "index"
              }
            ]
          }
        },
        {
          "name": "indexMint",
          "writable": true,
          "relations": [
            "index"
          ]
        },
        {
          "name": "userIndex",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "indexMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "treasury",
          "writable": true,
          "relations": [
            "index"
          ]
        },
        {
          "name": "usdcMint",
          "writable": true,
          "relations": [
            "index"
          ]
        },
        {
          "name": "userUsdc",
          "writable": true
        },
        {
          "name": "desk",
          "relations": [
            "index"
          ]
        },
        {
          "name": "deskProgram",
          "address": "H3Muxe6s3UwdhYCNg7zonSgjCYA3gwmtAiCCJQXcdgvf"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "usdcTokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "usdcIn",
          "type": "u64"
        },
        {
          "name": "minOut",
          "type": "u64"
        }
      ]
    },
    {
      "name": "cancelPlan",
      "discriminator": [
        249,
        184,
        138,
        159,
        83,
        183,
        210,
        142
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "plan"
          ]
        },
        {
          "name": "plan",
          "writable": true
        },
        {
          "name": "usdcMint"
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "plan"
              },
              {
                "kind": "account",
                "path": "usdcTokenProgram"
              },
              {
                "kind": "account",
                "path": "usdcMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "ownerUsdc",
          "writable": true
        },
        {
          "name": "usdcTokenProgram"
        }
      ],
      "args": []
    },
    {
      "name": "createPlan",
      "discriminator": [
        77,
        43,
        141,
        254,
        212,
        118,
        41,
        186
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "index",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  100,
                  101,
                  120
                ]
              },
              {
                "kind": "account",
                "path": "index.symbol",
                "account": "index"
              }
            ]
          }
        },
        {
          "name": "indexMint",
          "relations": [
            "index"
          ]
        },
        {
          "name": "plan",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "index"
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "arg",
                "path": "id"
              }
            ]
          }
        },
        {
          "name": "usdcMint",
          "relations": [
            "index"
          ]
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "plan"
              },
              {
                "kind": "account",
                "path": "usdcTokenProgram"
              },
              {
                "kind": "account",
                "path": "usdcMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "ownerUsdc",
          "writable": true
        },
        {
          "name": "ownerIndex",
          "docs": [
            "Created up front so runs never need the owner to pay rent."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "indexMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "usdcTokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "id",
          "type": "u64"
        },
        {
          "name": "usdcPerRun",
          "type": "u64"
        },
        {
          "name": "intervalSecs",
          "type": "i64"
        },
        {
          "name": "totalRuns",
          "type": "u32"
        },
        {
          "name": "deposit",
          "type": "u64"
        }
      ]
    },
    {
      "name": "executePlan",
      "discriminator": [
        179,
        120,
        71,
        186,
        93,
        192,
        198,
        231
      ],
      "accounts": [
        {
          "name": "keeper",
          "signer": true
        },
        {
          "name": "plan",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "index"
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "plan.id",
                "account": "plan"
              }
            ]
          }
        },
        {
          "name": "owner",
          "relations": [
            "plan"
          ]
        },
        {
          "name": "index",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  100,
                  101,
                  120
                ]
              },
              {
                "kind": "account",
                "path": "index.symbol",
                "account": "index"
              }
            ]
          },
          "relations": [
            "plan"
          ]
        },
        {
          "name": "indexMint",
          "writable": true,
          "relations": [
            "index"
          ]
        },
        {
          "name": "ownerIndex",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "indexMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "treasury",
          "writable": true,
          "relations": [
            "index"
          ]
        },
        {
          "name": "usdcMint",
          "writable": true,
          "relations": [
            "index"
          ]
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "plan"
              },
              {
                "kind": "account",
                "path": "usdcTokenProgram"
              },
              {
                "kind": "account",
                "path": "usdcMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "keeperUsdc",
          "writable": true
        },
        {
          "name": "desk",
          "relations": [
            "index"
          ]
        },
        {
          "name": "deskProgram",
          "address": "H3Muxe6s3UwdhYCNg7zonSgjCYA3gwmtAiCCJQXcdgvf"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "usdcTokenProgram"
        }
      ],
      "args": []
    },
    {
      "name": "initIndex",
      "docs": [
        "Create an index and its Token-2022 index mint (with on-mint metadata)."
      ],
      "discriminator": [
        206,
        236,
        58,
        58,
        171,
        221,
        237,
        57
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "index",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  100,
                  101,
                  120
                ]
              },
              {
                "kind": "arg",
                "path": "symbol"
              }
            ]
          }
        },
        {
          "name": "indexMint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  100,
                  101,
                  120,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "index"
              }
            ]
          }
        },
        {
          "name": "treasuryOwner"
        },
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "treasuryOwner"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "indexMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "usdcMint"
        },
        {
          "name": "desk"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "symbol",
          "type": "string"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "uri",
          "type": "string"
        },
        {
          "name": "mintFeeBps",
          "type": "u16"
        },
        {
          "name": "redeemFeeBps",
          "type": "u16"
        },
        {
          "name": "keeperTip",
          "type": "u64"
        }
      ]
    },
    {
      "name": "mintInKind",
      "discriminator": [
        101,
        248,
        37,
        42,
        151,
        216,
        11,
        83
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "index",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  100,
                  101,
                  120
                ]
              },
              {
                "kind": "account",
                "path": "index.symbol",
                "account": "index"
              }
            ]
          }
        },
        {
          "name": "indexMint",
          "writable": true,
          "relations": [
            "index"
          ]
        },
        {
          "name": "userIndex",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "indexMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "treasury",
          "writable": true,
          "relations": [
            "index"
          ]
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "pausePlan",
      "discriminator": [
        208,
        200,
        160,
        171,
        212,
        94,
        249,
        233
      ],
      "accounts": [
        {
          "name": "owner",
          "signer": true,
          "relations": [
            "plan"
          ]
        },
        {
          "name": "plan",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "redeemInKind",
      "discriminator": [
        102,
        58,
        189,
        252,
        192,
        219,
        140,
        89
      ],
      "accounts": [
        {
          "name": "user",
          "signer": true
        },
        {
          "name": "index",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  100,
                  101,
                  120
                ]
              },
              {
                "kind": "account",
                "path": "index.symbol",
                "account": "index"
              }
            ]
          }
        },
        {
          "name": "indexMint",
          "writable": true,
          "relations": [
            "index"
          ]
        },
        {
          "name": "userIndex",
          "writable": true
        },
        {
          "name": "treasury",
          "writable": true,
          "relations": [
            "index"
          ]
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "resumePlan",
      "discriminator": [
        67,
        173,
        251,
        42,
        169,
        34,
        132,
        161
      ],
      "accounts": [
        {
          "name": "owner",
          "signer": true,
          "relations": [
            "plan"
          ]
        },
        {
          "name": "plan",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "setMetadataUri",
      "discriminator": [
        30,
        134,
        3,
        67,
        40,
        90,
        245,
        34
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "index"
          ]
        },
        {
          "name": "index",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  100,
                  101,
                  120
                ]
              },
              {
                "kind": "account",
                "path": "index.symbol",
                "account": "index"
              }
            ]
          }
        },
        {
          "name": "indexMint",
          "writable": true,
          "relations": [
            "index"
          ]
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "uri",
          "type": "string"
        }
      ]
    },
    {
      "name": "setParams",
      "discriminator": [
        27,
        234,
        178,
        52,
        147,
        2,
        187,
        141
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "index"
          ]
        },
        {
          "name": "index",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  100,
                  101,
                  120
                ]
              },
              {
                "kind": "account",
                "path": "index.symbol",
                "account": "index"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "mintFeeBps",
          "type": "u16"
        },
        {
          "name": "redeemFeeBps",
          "type": "u16"
        },
        {
          "name": "keeperTip",
          "type": "u64"
        },
        {
          "name": "paused",
          "type": "bool"
        }
      ]
    },
    {
      "name": "topUpPlan",
      "discriminator": [
        232,
        118,
        117,
        35,
        12,
        52,
        25,
        132
      ],
      "accounts": [
        {
          "name": "owner",
          "signer": true,
          "relations": [
            "plan"
          ]
        },
        {
          "name": "plan"
        },
        {
          "name": "usdcMint"
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "plan"
              },
              {
                "kind": "account",
                "path": "usdcTokenProgram"
              },
              {
                "kind": "account",
                "path": "usdcMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "ownerUsdc",
          "writable": true
        },
        {
          "name": "usdcTokenProgram"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "index",
      "discriminator": [
        140,
        66,
        194,
        132,
        78,
        26,
        135,
        186
      ]
    },
    {
      "name": "plan",
      "discriminator": [
        161,
        231,
        251,
        119,
        2,
        12,
        162,
        2
      ]
    }
  ],
  "events": [
    {
      "name": "indexBought",
      "discriminator": [
        219,
        75,
        206,
        183,
        140,
        169,
        50,
        30
      ]
    },
    {
      "name": "indexCreated",
      "discriminator": [
        172,
        84,
        43,
        253,
        171,
        30,
        254,
        244
      ]
    },
    {
      "name": "indexMinted",
      "discriminator": [
        125,
        192,
        74,
        111,
        87,
        28,
        26,
        177
      ]
    },
    {
      "name": "indexRedeemed",
      "discriminator": [
        209,
        234,
        247,
        252,
        232,
        192,
        196,
        253
      ]
    },
    {
      "name": "planCancelled",
      "discriminator": [
        162,
        81,
        106,
        228,
        226,
        199,
        160,
        173
      ]
    },
    {
      "name": "planCreated",
      "discriminator": [
        215,
        11,
        135,
        121,
        208,
        119,
        149,
        149
      ]
    },
    {
      "name": "planExecuted",
      "discriminator": [
        0,
        29,
        202,
        61,
        45,
        36,
        206,
        233
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "paused",
      "msg": "Index is paused"
    },
    {
      "code": 6001,
      "name": "zeroAmount",
      "msg": "Amount must be greater than zero"
    },
    {
      "code": 6002,
      "name": "feeTooHigh",
      "msg": "Fee exceeds the maximum"
    },
    {
      "code": 6003,
      "name": "symbolTooLong",
      "msg": "Symbol too long"
    },
    {
      "code": 6004,
      "name": "tooManyComponents",
      "msg": "Index already has the maximum number of components"
    },
    {
      "code": 6005,
      "name": "duplicateComponent",
      "msg": "Component already exists"
    },
    {
      "code": 6006,
      "name": "compositionLocked",
      "msg": "Composition is locked once index tokens exist"
    },
    {
      "code": 6007,
      "name": "noComponents",
      "msg": "Index has no components"
    },
    {
      "code": 6008,
      "name": "componentMismatch",
      "msg": "Remaining accounts do not match the index components"
    },
    {
      "code": 6009,
      "name": "insufficientDeposit",
      "msg": "Vault received less than required"
    },
    {
      "code": 6010,
      "name": "slippageExceeded",
      "msg": "Output below minimum (slippage)"
    },
    {
      "code": 6011,
      "name": "budgetTooSmall",
      "msg": "Budget too small to buy any index tokens"
    },
    {
      "code": 6012,
      "name": "feedMismatch",
      "msg": "Price feed does not match component"
    },
    {
      "code": 6013,
      "name": "intervalTooShort",
      "msg": "Interval too short"
    },
    {
      "code": 6014,
      "name": "planNotActive",
      "msg": "Plan is not active"
    },
    {
      "code": 6015,
      "name": "planNotPaused",
      "msg": "Plan is not paused"
    },
    {
      "code": 6016,
      "name": "planNotDue",
      "msg": "Plan run is not due yet"
    },
    {
      "code": 6017,
      "name": "planUnderfunded",
      "msg": "Plan escrow cannot cover the next run"
    },
    {
      "code": 6018,
      "name": "mathOverflow",
      "msg": "Arithmetic overflow"
    }
  ],
  "types": [
    {
      "name": "component",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "vault",
            "docs": [
              "Index-PDA-owned ATA holding this component's backing."
            ],
            "type": "pubkey"
          },
          {
            "name": "units",
            "docs": [
              "Component base units backing 1 whole index token (10^9 index base units)."
            ],
            "type": "u64"
          },
          {
            "name": "decimals",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "desk",
      "docs": [
        "Global desk config. The desk PDA is the mint authority of every demo mint",
        "(demo T-Tokens and dUSDC), so it can \"fill\" buys and sells at mark price",
        "without holding inventory."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "priceAuthority",
            "docs": [
              "Signer allowed to post prices (the keeper)."
            ],
            "type": "pubkey"
          },
          {
            "name": "usdcMint",
            "docs": [
              "Demo USDC mint (6 decimals)."
            ],
            "type": "pubkey"
          },
          {
            "name": "maxPriceAge",
            "docs": [
              "Max age of a price, in seconds, before trades are rejected."
            ],
            "type": "i64"
          },
          {
            "name": "faucetAmount",
            "docs": [
              "dUSDC base units minted per faucet claim."
            ],
            "type": "u64"
          },
          {
            "name": "faucetCooldown",
            "docs": [
              "Seconds between faucet claims per wallet."
            ],
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "index",
      "docs": [
        "A fully backed, in-kind index. Invariant, per component:",
        "`vault.amount >= ceil(supply * units / 10^9)`."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "indexMint",
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "docs": [
              "Index-token account that receives mint/redeem fees."
            ],
            "type": "pubkey"
          },
          {
            "name": "usdcMint",
            "docs": [
              "Quote mint for USDC buys and Auto-Invest."
            ],
            "type": "pubkey"
          },
          {
            "name": "desk",
            "docs": [
              "Swap venue config account (demo_desk `Desk` on devnet)."
            ],
            "type": "pubkey"
          },
          {
            "name": "mintFeeBps",
            "type": "u16"
          },
          {
            "name": "redeemFeeBps",
            "type": "u16"
          },
          {
            "name": "keeperTip",
            "docs": [
              "USDC paid from plan escrow to whoever executes an Auto-Invest run."
            ],
            "type": "u64"
          },
          {
            "name": "paused",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "mintBump",
            "type": "u8"
          },
          {
            "name": "componentCount",
            "type": "u8"
          },
          {
            "name": "components",
            "type": {
              "array": [
                {
                  "defined": {
                    "name": "component"
                  }
                },
                5
              ]
            }
          }
        ]
      }
    },
    {
      "name": "indexBought",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "index",
            "type": "pubkey"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "usdcSpent",
            "type": "u64"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "fee",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "indexCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "index",
            "type": "pubkey"
          },
          {
            "name": "indexMint",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "indexMinted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "index",
            "type": "pubkey"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "fee",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "indexRedeemed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "index",
            "type": "pubkey"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "fee",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "plan",
      "docs": [
        "Recurring USDC → index buy. USDC sits in an escrow ATA owned by this PDA;",
        "anyone may execute a run once it is due and earns the index's keeper tip."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "index",
            "type": "pubkey"
          },
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "usdcPerRun",
            "type": "u64"
          },
          {
            "name": "intervalSecs",
            "type": "i64"
          },
          {
            "name": "totalRuns",
            "docs": [
              "0 = ongoing until cancelled or out of funds."
            ],
            "type": "u32"
          },
          {
            "name": "runsDone",
            "type": "u32"
          },
          {
            "name": "nextRunTs",
            "type": "i64"
          },
          {
            "name": "lastRunTs",
            "type": "i64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "totalSpent",
            "type": "u64"
          },
          {
            "name": "totalIndexBought",
            "type": "u64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "planStatus"
              }
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "planCancelled",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "plan",
            "type": "pubkey"
          },
          {
            "name": "refunded",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "planCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "plan",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "usdcPerRun",
            "type": "u64"
          },
          {
            "name": "intervalSecs",
            "type": "i64"
          },
          {
            "name": "totalRuns",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "planExecuted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "plan",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "keeper",
            "type": "pubkey"
          },
          {
            "name": "run",
            "type": "u32"
          },
          {
            "name": "usdcSpent",
            "type": "u64"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "nextRunTs",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "planStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "active"
          },
          {
            "name": "paused"
          },
          {
            "name": "completed"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "indexMintSeed",
      "type": "bytes",
      "value": "[105, 110, 100, 101, 120, 95, 109, 105, 110, 116]"
    },
    {
      "name": "indexSeed",
      "type": "bytes",
      "value": "[105, 110, 100, 101, 120]"
    },
    {
      "name": "planSeed",
      "type": "bytes",
      "value": "[112, 108, 97, 110]"
    }
  ]
};

/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/demo_desk.json`.
 */
export type DemoDesk = {
  "address": "H3Muxe6s3UwdhYCNg7zonSgjCYA3gwmtAiCCJQXcdgvf",
  "metadata": {
    "name": "demoDesk",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Assetra demo desk: devnet stand-in DEX for demo T-Tokens at Tessera mark prices"
  },
  "docs": [
    "Assetra demo desk (DEVNET ONLY).",
    "",
    "Stands in for a DEX so the Frontier Index can be demoed end-to-end on",
    "devnet. It fills buys and sells of demo T-Tokens against dUSDC at the",
    "Tessera mark price posted by the keeper, by minting and burning (the desk",
    "PDA is the mint authority of every demo mint). On mainnet this is replaced",
    "by real DEX routing of the real Tessera mints."
  ],
  "instructions": [
    {
      "name": "buy",
      "docs": [
        "Spend exactly `usdc_in` dUSDC; receive at least `min_out` T-Tokens."
      ],
      "discriminator": [
        102,
        6,
        61,
        18,
        1,
        218,
        235,
        234
      ],
      "accounts": [
        {
          "name": "buyer",
          "docs": [
            "Owner of `buyer_usdc`. May be a PDA signing via CPI (e.g. an Auto-Invest plan)."
          ],
          "signer": true
        },
        {
          "name": "desk",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  115,
                  107
                ]
              }
            ]
          }
        },
        {
          "name": "feed",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "tMint"
              }
            ]
          }
        },
        {
          "name": "tMint",
          "writable": true
        },
        {
          "name": "usdcMint",
          "writable": true
        },
        {
          "name": "buyerUsdc",
          "writable": true
        },
        {
          "name": "recipient",
          "docs": [
            "Receives the T-Tokens. Any owner (e.g. an index vault)."
          ],
          "writable": true
        },
        {
          "name": "tTokenProgram"
        },
        {
          "name": "usdcTokenProgram"
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
      "name": "buyExactOut",
      "docs": [
        "Receive exactly `amount_out` T-Tokens; spend at most `max_usdc_in` dUSDC."
      ],
      "discriminator": [
        24,
        211,
        116,
        40,
        105,
        3,
        153,
        56
      ],
      "accounts": [
        {
          "name": "buyer",
          "docs": [
            "Owner of `buyer_usdc`. May be a PDA signing via CPI (e.g. an Auto-Invest plan)."
          ],
          "signer": true
        },
        {
          "name": "desk",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  115,
                  107
                ]
              }
            ]
          }
        },
        {
          "name": "feed",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "tMint"
              }
            ]
          }
        },
        {
          "name": "tMint",
          "writable": true
        },
        {
          "name": "usdcMint",
          "writable": true
        },
        {
          "name": "buyerUsdc",
          "writable": true
        },
        {
          "name": "recipient",
          "docs": [
            "Receives the T-Tokens. Any owner (e.g. an index vault)."
          ],
          "writable": true
        },
        {
          "name": "tTokenProgram"
        },
        {
          "name": "usdcTokenProgram"
        }
      ],
      "args": [
        {
          "name": "amountOut",
          "type": "u64"
        },
        {
          "name": "maxUsdcIn",
          "type": "u64"
        }
      ]
    },
    {
      "name": "faucet",
      "docs": [
        "Rate-limited dUSDC faucet for demo wallets."
      ],
      "discriminator": [
        0,
        98,
        59,
        30,
        144,
        142,
        113,
        12
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "desk",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  115,
                  107
                ]
              }
            ]
          }
        },
        {
          "name": "claim",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  97,
                  117,
                  99,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "usdcMint",
          "writable": true
        },
        {
          "name": "userUsdc",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
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
      "args": []
    },
    {
      "name": "initDesk",
      "discriminator": [
        215,
        181,
        95,
        245,
        31,
        190,
        64,
        208
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "desk",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  115,
                  107
                ]
              }
            ]
          }
        },
        {
          "name": "usdcMint"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "priceAuthority",
          "type": "pubkey"
        },
        {
          "name": "maxPriceAge",
          "type": "i64"
        },
        {
          "name": "faucetAmount",
          "type": "u64"
        },
        {
          "name": "faucetCooldown",
          "type": "i64"
        }
      ]
    },
    {
      "name": "initFeed",
      "discriminator": [
        203,
        50,
        143,
        146,
        170,
        34,
        46,
        93
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true,
          "relations": [
            "desk"
          ]
        },
        {
          "name": "desk",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  115,
                  107
                ]
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "feed",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "price",
          "type": "u64"
        }
      ]
    },
    {
      "name": "sell",
      "docs": [
        "Sell exactly `amount_in` T-Tokens; receive at least `min_usdc_out` dUSDC."
      ],
      "discriminator": [
        51,
        230,
        133,
        164,
        1,
        127,
        131,
        173
      ],
      "accounts": [
        {
          "name": "seller",
          "signer": true
        },
        {
          "name": "desk",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  115,
                  107
                ]
              }
            ]
          }
        },
        {
          "name": "feed",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "tMint"
              }
            ]
          }
        },
        {
          "name": "tMint",
          "writable": true
        },
        {
          "name": "usdcMint",
          "writable": true
        },
        {
          "name": "sellerT",
          "writable": true
        },
        {
          "name": "recipientUsdc",
          "writable": true
        },
        {
          "name": "tTokenProgram"
        },
        {
          "name": "usdcTokenProgram"
        }
      ],
      "args": [
        {
          "name": "amountIn",
          "type": "u64"
        },
        {
          "name": "minUsdcOut",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setConfig",
      "discriminator": [
        108,
        158,
        154,
        175,
        212,
        98,
        52,
        66
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true,
          "relations": [
            "desk"
          ]
        },
        {
          "name": "desk",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  115,
                  107
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "priceAuthority",
          "type": "pubkey"
        },
        {
          "name": "maxPriceAge",
          "type": "i64"
        },
        {
          "name": "faucetAmount",
          "type": "u64"
        },
        {
          "name": "faucetCooldown",
          "type": "i64"
        }
      ]
    },
    {
      "name": "updatePrice",
      "docs": [
        "Keeper posts the latest Tessera mark price (micro-USD per whole token)."
      ],
      "discriminator": [
        61,
        34,
        117,
        155,
        75,
        34,
        123,
        208
      ],
      "accounts": [
        {
          "name": "priceAuthority",
          "signer": true,
          "relations": [
            "desk"
          ]
        },
        {
          "name": "desk",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  115,
                  107
                ]
              }
            ]
          }
        },
        {
          "name": "feed",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "feed.mint",
                "account": "priceFeed"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "price",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "desk",
      "discriminator": [
        33,
        28,
        147,
        6,
        226,
        158,
        166,
        73
      ]
    },
    {
      "name": "faucetClaim",
      "discriminator": [
        88,
        39,
        189,
        221,
        15,
        215,
        24,
        248
      ]
    },
    {
      "name": "priceFeed",
      "discriminator": [
        189,
        103,
        252,
        23,
        152,
        35,
        243,
        156
      ]
    }
  ],
  "events": [
    {
      "name": "faucetClaimed",
      "discriminator": [
        153,
        213,
        25,
        224,
        176,
        249,
        203,
        218
      ]
    },
    {
      "name": "priceUpdated",
      "discriminator": [
        154,
        72,
        87,
        150,
        246,
        230,
        23,
        217
      ]
    },
    {
      "name": "traded",
      "discriminator": [
        225,
        202,
        73,
        175,
        147,
        43,
        160,
        150
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidQuoteDecimals",
      "msg": "Quote mint must have 6 decimals"
    },
    {
      "code": 6001,
      "name": "invalidPrice",
      "msg": "Price must be greater than zero"
    },
    {
      "code": 6002,
      "name": "stalePrice",
      "msg": "Price feed is stale"
    },
    {
      "code": 6003,
      "name": "zeroAmount",
      "msg": "Amount must be greater than zero"
    },
    {
      "code": 6004,
      "name": "slippageExceeded",
      "msg": "Output below minimum (slippage)"
    },
    {
      "code": 6005,
      "name": "faucetCooldown",
      "msg": "Faucet cooldown has not elapsed"
    },
    {
      "code": 6006,
      "name": "mathOverflow",
      "msg": "Arithmetic overflow"
    }
  ],
  "types": [
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
      "name": "faucetClaim",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "lastClaim",
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
      "name": "faucetClaimed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "priceFeed",
      "docs": [
        "Mark price for one demo T-Token, mirrored from the Tessera API."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "price",
            "docs": [
              "Micro-USD (quote base units) per whole token."
            ],
            "type": "u64"
          },
          {
            "name": "updatedAt",
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
      "name": "priceUpdated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "updatedAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "traded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "trader",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "isBuy",
            "type": "bool"
          },
          {
            "name": "tokenAmount",
            "type": "u64"
          },
          {
            "name": "usdcAmount",
            "type": "u64"
          },
          {
            "name": "price",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "deskSeed",
      "type": "bytes",
      "value": "[100, 101, 115, 107]"
    },
    {
      "name": "faucetSeed",
      "type": "bytes",
      "value": "[102, 97, 117, 99, 101, 116]"
    },
    {
      "name": "feedSeed",
      "type": "bytes",
      "value": "[102, 101, 101, 100]"
    }
  ]
};

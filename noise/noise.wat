(module
  (func (export "whitenoise") (param $random f32) (result f32)
    (f32.sub (f32.mul (f32.const 2.0) (local.get $random)) (f32.const 1.0))
  )

  (global $b0 (mut f32) (f32.const 0))
  (global $b1 (mut f32) (f32.const 0))
  (global $b2 (mut f32) (f32.const 0))
  (global $b3 (mut f32) (f32.const 0))
  (global $b4 (mut f32) (f32.const 0))
  (global $b5 (mut f32) (f32.const 0))
  (global $b6 (mut f32) (f32.const 0))

  (func (export "pinknoise") (param $random f32) (result f32)
    (local $o f32)

    (global.set $b0 (f32.add (f32.mul (f32.const 0.99886) (global.get $b0)) (f32.mul (f32.const 0.0555179) (f32.sub (f32.mul (f32.const 2.0) (local.get $random)) (f32.const 1.0)))))
    (global.set $b1 (f32.add (f32.mul (f32.const 0.99332) (global.get $b1)) (f32.mul (f32.const 0.0555179) (f32.sub (f32.mul (f32.const 2.0) (local.get $random)) (f32.const 1.0)))))
    (global.set $b2 (f32.add (f32.mul (f32.const 0.96900) (global.get $b2)) (f32.mul (f32.const 0.1538520) (f32.sub (f32.mul (f32.const 2.0) (local.get $random)) (f32.const 1.0)))))
    (global.set $b3 (f32.add (f32.mul (f32.const 0.86650) (global.get $b3)) (f32.mul (f32.const 0.3104856) (f32.sub (f32.mul (f32.const 2.0) (local.get $random)) (f32.const 1.0)))))
    (global.set $b4 (f32.add (f32.mul (f32.const 0.55000) (global.get $b4)) (f32.mul (f32.const 0.5329522) (f32.sub (f32.mul (f32.const 2.0) (local.get $random)) (f32.const 1.0)))))
    (global.set $b5 (f32.sub (f32.mul (f32.const -0.7616) (global.get $b5)) (f32.mul (f32.const 0.0168980) (f32.sub (f32.mul (f32.const 2.0) (local.get $random)) (f32.const 1.0)))))

    (local.set $o
      (f32.mul
        (f32.const 0.11)
        (f32.add
          (f32.add
            (f32.add
              (f32.add
                (global.get $b0)
                (global.get $b1)
              )
              (f32.add
                (global.get $b2)
                (global.get $b3)
              )
            )
            (f32.add
              (f32.add
                (global.get $b4)
                (global.get $b5)
              )
              (global.get $b6)
            )
          )
          (f32.mul
            (f32.sub (f32.mul (local.get $random) (f32.const 2)) (f32.const 1))
            (f32.const 0.5362)
          )
        )
      )
    )

    (local.get $o)

    (global.set $b6
      (f32.mul
        (f32.sub
          (f32.mul (local.get $random) (f32.const 2))
          (f32.const 1)
        )
        (f32.const 0.115926)
      )
    )
  )

  (global $lastOut (mut f32) (f32.const 0))

  (func (export "browniannoise") (param $random f32) (result f32)
    (local $whitenoise f32)
    (local $o f32)

    (local.set $whitenoise (f32.sub (f32.mul (f32.const 2.0) (local.get $random)) (f32.const 1.0)))

    (local.set $o
      (f32.mul
        (f32.const 3.5)
        (f32.div
          (f32.add
            (global.get $lastOut)
            (f32.mul
              (f32.const 0.02)
              (local.get $whitenoise)
            )
          )
          (f32.const 1.02)
        )
      )
    )

    (global.set $lastOut
      (f32.div
        (f32.add
          (global.get $lastOut)
          (f32.mul
            (f32.const 0.02)
            (local.get $whitenoise)
          )
        )
        (f32.const 1.02)
      )
    )

    (local.get $o)
  )
)

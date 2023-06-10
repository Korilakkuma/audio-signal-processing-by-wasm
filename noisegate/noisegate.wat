(module
  (func (export "noisegate") (param $input f32) (param $level f32) (result f32)
    (local $output f32)

    local.get $input
    local.get $level
    f32.gt

    local.get $input
    f32.const 0
    local.get $level
    f32.sub
    f32.lt

    i32.or

    if
      local.get $input
      local.set $output
    else
      f32.const 0
      local.set $output
    end

    local.get $output
  )
)

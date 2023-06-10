(module
  (func (export "vocalcanceler") (param $left f32) (param $right f32) (param $depth f32) (result f32)
    local.get $left
    local.get $right
    local.get $depth
    f32.mul
    f32.sub
  )
)

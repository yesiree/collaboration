function Revision() {
  this.ops = []
  this.startLength = 0
  this.endLength = 0
}
Revision.prototype.applyTo = function (str) {
  if (typeof str !== 'string') {
    throw new Error("Cannot apply revision to non-string value.")
  }
  if (str.length !== this.startLength) {
    throw new Error("Cannot apply revision with start length of '" + this.startLength + "' to string of length '" + str.length + "'. Lengths must be equal.")
  }
  const pieces = []
  let pos = 0
  for (let i = 0, l = this.ops.length; i < l; i++) {
    const op = this.ops[i]
    const type = Revision.getType(op)
    if (type === 'insert') {
      pieces.push(op)
    } else if (type === 'remove') {
      pos += -op
    } else {
      if (pos + op > str.length) {
        throw new Error("Failed to apply revision to string. Revision start length was incorrect (1).")
      }
      pieces.push(str.substring(pos, pos + op))
      pos += op
    }
  }
  if (pos !== str.length) {
    throw new Error("Failed to apply revision to string. Revision start length was incorrect (2).")
  }
  return pieces.join('')
}
Revision.prototype.reverse = function (str) {
  const inverse = new Revision()
  let pos = 0
  for (let i = 0, l = this.ops.length; i < l; i++) {
    const op = this.ops[i]
    const type = Revision.getType(op)
    if (type === 'retain') {
      inverse.retain(op)
      pos += op
    } else if (type === 'insert') {
      inverse.remove(op.length)
    } else {
      inverse.insert(str.substring(pos, pos - op))
      pos -= op
    }
  }
  return inverse
}
Revision.prototype.retain = function (count) {
  if (typeof count !== 'number') {
    throw new Error("Parameter 'count' must be of type 'number'.")
  }
  if (count === 0) return
  this.startLength += count
  this.endLength += count
  const backOne = this.ops.length - 1
  const last = this.ops[backOne]
  if (typeof last === 'number' && last > 0) {
    this.ops[backOne] += count
  } else {
    this.ops.push(count)
  }
  return this
}
Revision.prototype.insert = function (str) {
  if (typeof str !== 'string') {
    throw new Error("Parameter 'str' must be of type 'string'.")
  }
  if (str === '') return
  this.endLength += str.length
  const backOne = this.ops.length - 1
  const last = this.ops[backOne]
  if (typeof last === 'string') {
    this.ops[backOne] += str
  } else if (typeof last === 'number' && last < 0) {
    const backTwo = this.ops.length - 2
    const secondToLast = this.ops[backTwo]
    if (typeof secondToLast === 'string') {
      this.ops[backTwo] += str
    } else {
      this.ops[this.ops.length] = this.ops[backOne]
      this.ops[backOne] = str
    }
  } else {
    this.ops.push(str)
  }
  return this
}
Revision.prototype.remove = function (count) {
  if (typeof count !== 'number') {
    throw new Error("Parameter 'count' must be of type 'integer'.")
  }
  if (count === 0) return
  if (count > 0) count = -count
  this.startLength -= count
  var backOne = this.ops.length - 1
  var last = this.ops[backOne]
  if (typeof last === 'number' && last < 0) {
    this.ops[backOne] += count
  } else {
    this.ops.push(count)
  }
  return this
}
Revision.prototype.equals = function (rev2) {
  var rev1 = this
  if (rev1.startLength !== rev2.startLength ||
    rev1.endLength !== rev2.endLength ||
    rev1.ops.length !== rev2.ops.length) {
    return false
  }
  for (var i = 0, l = rev1.ops.length; i < l; i++) {
    if (rev1.ops[i] !== rev2.ops[i]) return false
  }
  return true
}
Revision.prototype.serialize = function () {
  return JSON.stringify(this.ops)
}
Revision.deserialize = function (ops) {
  if (typeof ops === 'string') {
    ops = JSON.parse(ops)
  }
  var rev = new Revision()
  for (var i = 0, l = ops.length; i < l; i++) {
    var op = ops[i]
    var type = Revision.getType(op)
    rev[type](op)
  }
  return rev
}
Revision.prototype.getOperations = function () {
  return this.ops.slice()
}
Revision.prototype.compose = function (...revs) {
  Revision.compose(revs)
}
Revision.compose = function (...revs) {
  if (revs.length === 1 && Array.isArray(revs[0])) {
    revs = revs[0]
  }
  var current = revs.shift()
  var next = revs.shift()
  var combined
  if (current && !next) return current
  while (next !== void 0) {
    if (current.endLength !== next.startLength) {
      throw new Error("Cannot compose revisions where first revision end length (" + current.endLength + ") does not match second revision start length (" + next.startLength + ").")
    }
    combined = new Revision()
    var i1 = 0, i2 = 0
    var op1 = current.ops[i1++]
    var op2 = next.ops[i2++]
    while (!(op1 === void 0 && op2 === void 0)) {
      var type1 = Revision.getType(op1)
      var type2 = Revision.getType(op2)
      if (type1 === 'remove') {
        combined.remove(op1)
        op1 = current.ops[i1++]
        continue
      }
      if (type2 === 'insert') {
        combined.insert(op2)
        op2 = next.ops[i2++]
        continue
      }
      if (op1 === void 0 || op2 === void 0) {
        throw new Error("Failed to compose revisions. One of the revisions is too short.")
      }
      if (type1 === 'retain' && type2 === 'retain') {
        if (op1 > op2) {
          combined.retain(op2)
          op1 -= op2
          op2 = next.ops[i2++]
        } else if (op1 === op2) {
          combined.retain(op1)
          op1 = current.ops[i1++]
          op2 = next.ops[i2++]
        } else { // op1 < op2
          combined.retain(op1)
          op2 -= op1
          op1 = current.ops[i1++]
        }
      } else if (type1 === 'retain' && type2 === 'remove') {
        if (op1 > -op2) {
          combined.remove(op2)
          op1 += op2
          op2 = next.ops[i2++]
        } else if (op1 === -op2) {
          combined.remove(op2)
          op1 = current.ops[i1++]
          op2 = next.ops[i2++]
        } else { // op1 < -op2
          combined.remove(op1)
          op2 += op1
          op1 = current.ops[i1++]
        }
      } else if (type1 === 'insert' && type2 === 'remove') {
        if (op1.length > -op2) {
          op1 = op1.substring(-op2)
          op2 = next.ops[i2++]
        } else if (op1.length === -op2) {
          op1 = current.ops[i1++]
          op2 = next.ops[i2++]
        } else { // op1.length < -op2
          op2 += op1.length
          op1 = current.ops[i1++]
        }
      } else if (type1 === 'insert' && type2 === 'retain') {
        if (op1.length > op2) {
          combined.insert(op1.substring(0, op2))
          op1 = op1.substring(op2)
          op2 = next.ops[i2++]
        } else if (op1.length === op2) {
          combined.insert(op1)
          op1 = current.ops[i1++]
          op2 = next.ops[i2++]
        } else { // op1.length < op2
          combined.insert(op1)
          op2 -= op1.length
          op1 = current.ops[i1++]
        }
      } else {
        throw Error("OT:compose(...revs): This shouldn't happen!")
      }
    }
    current = combined
    next = revs.shift()
  }
  return combined
}
Revision.transform = function (rev1, rev2) {
  if (rev1.startLength !== rev2.startLength) {
    throw new Error("Cannot transform two revisions with different start lengths.")
  }
  var prime1 = new Revision()
  var prime2 = new Revision()
  var i1 = 0, i2 = 0
  var op1 = rev1.ops[i1++]
  var op2 = rev2.ops[i2++]
  while (!(op1 === void 0 && op2 === void 0)) {
    var type1 = Revision.getType(op1)
    var type2 = Revision.getType(op2)
    if (type1 === 'insert') {
      prime1.insert(op1)
      prime2.retain(op1.length)
      op1 = rev1.ops[i1++]
      continue
    }
    if (type2 === 'insert') {
      prime1.retain(op2.length)
      prime2.insert(op2)
      op2 = rev2.ops[i2++]
      continue
    }
    if (op1 === void 0 || op2 === void 0) {
      throw new Error("Cannot transform revisions. The " + (op1 === void 0 ? 'first' : 'second') + " revision is too short.")
    }
    var min = void 0
    if (type1 === 'retain' && type2 === 'retain') {
      if (op1 > op2) {
        min = op2
        op1 -= op2
        op2 = rev2.ops[i2++]
      } else if (op1 === op2) {
        min = op2
        op1 = rev1.ops[i1++]
        op2 = rev2.ops[i2++]
      } else {
        min = op1
        op2 -= op1
        op1 = rev1.ops[i1++]
      }
      prime1.retain(min)
      prime2.retain(min)
    } else if (type1 === 'remove' && type2 === 'remove') {
      if (-op1 > -op2) {
        op1 -= op2
        op2 = rev2.ops[i2++]
      } else if (op1 === op2) {
        op1 = rev1.ops[i1++]
        op2 = rev2.ops[i2++]
      } else {
        op2 -= op1
        op1 = rev1.ops[i1++]
      }
    } else if (type1 === 'remove' && type2 === 'retain') {
      if (-op1 > op2) {
        min = op2
        op1 += op2
        op2 = rev2.ops[i2++]
      } else if (-op1 === op2) {
        min = op2
        op1 = rev1.ops[i1++]
        op2 = rev2.ops[i2++]
      } else {
        min = -op1
        op2 += op1
        op1 = rev1.ops[i1++]
      }
      prime1.remove(min)
    } else if (type1 === 'retain' && type2 === 'remove') {
      if (op1 > -op2) {
        min = -op2
        op1 += op2
        op2 = rev2.ops[i2++]
      } else if (op1 === -op2) {
        min = op1
        op1 = rev1.ops[i1++]
        op2 = rev2.ops[i2++]
      } else {
        min = op1
        op2 += op1
        op1 = rev1.ops[i1++]
      }
      prime2.remove(min)
    } else {
      throw new Error("This should not be possible.")
    }
  }
  return [prime1, prime2]
}
Revision.getType = function (op) {
  if (op === void 0) return 'undefined'
  return typeof op === 'number'
    ? op < 0
      ? 'remove'
      : 'retain'
    : 'insert'
}

module.exports = Revision

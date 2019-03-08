describe('Revision', () => {
  const { Revision } = require('../revision')

  beforeEach(function () {

  })

  it(`should be able to revise a string`, () => {
    const result = new Revision()
      .retain(5)
      .remove(1)
      .insert('-')
      .retain(5)
      .applyTo('Hello World')

    expect(result).toEqual('Hello-World')
  })

  it(`should be able to make basic revisions on a string`, () => {
    const revs = [
      ['Hello-World', new Revision().retain(5).remove(1).insert('-').retain(5)]
      , ['Hello World!', new Revision().retain(11).insert('!')]
      , ['Hello<>World', new Revision().retain(5).remove(1).insert('<>').retain(5)]
      , ['Hello Bob! Welcome to my world', new Revision().retain(5).insert(' Bob! Welcome to my w').remove(2).retain(4)]
    ]
    revs.forEach(([expected, rev]) => {
      expect(rev.applyTo('Hello World')).toEqual(expected)
    })
  })

  it(`should be able to compose revisions into a single revision that produces the same results as each of the individual revisions applied in sequence`, () => {
    const revs = [
      new Revision().retain(11).insert('!')
      , new Revision().retain(6).insert('Bob! Welcome to my w').remove(1).retain(5)
      , new Revision().retain(5)
        .remove(1).insert('-').retain(4)
        .remove(1).insert('-').retain(7)
        .remove(1).insert('-').retain(2)
        .remove(1).insert('-').retain(2)
        .remove(1).insert('-').retain(6)
    ]
    const result = Revision.compose(...revs).applyTo('Hello World')
    expect(result).toEqual('Hello-Bob!-Welcome-to-my-world!')
  })

  it(`should be equal regardless of the order of 'insert' and 'remove' operations`, () => {
    const rev1 = new Revision()
      .retain(5)
      .insert(',')
      .remove(5)
      .insert(' Alice')

    const rev2 = new Revision()
      .retain(5)
      .insert(', Alice')
      .remove(5)

    expect(rev1.equals(rev2)).toEqual(true)
  })

  it(`should be able to transform concurrent revisions to provide a consistant resolution for multiple editors`, () => {
    const str = 'Hello World'
    const revsA = [
      new Revision().retain(5).remove(1).insert('-').retain(5),
      new Revision().retain(9).insert('d ba').retain(2)
    ]
    const revA = Revision.compose(revsA)
    const revB = new Revision().retain(5).remove(6).insert('!')
    const [primeA, primeB] = Revision.transform(revA, revB)

    const resultA = primeA.applyTo(revB.applyTo(str))
    const resultB = primeB.applyTo(revA.applyTo(str))

    expect(resultA).toEqual(resultB)
  })

})

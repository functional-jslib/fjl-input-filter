import {range$} from 'fjl-range';
import {apply} from 'fjl';
import {expect, assert} from 'chai';

export const

    log = console.log.bind(console),

    peek = x => {
        log(x);
        return x;
    },

    genRan = (min, max) => Math.round(Math.random() * max),

    genRanChar = (min = 0, max = 0x10FFFF) =>
        String.fromCharCode(genRan(min, max)),

    genRanStr = (min = 0, max = 100) =>
        range$(min, max)
            .reduce(str => str + genRanChar(min, max), ''),

    runHasPropOfType = (Type, propName, [correctValue, incorrectValue], x) => {
        expect(x.hasOwnProperty(propName)).to.equal(true);
        assert.throws(() => x[propName] = incorrectValue, Error);
        expect(x[propName] = correctValue).to.equal(correctValue);
    },

    runHasPropTypes = (propTypeArgsList, x) =>
        propTypeArgsList.forEach(args => {
            const _args = args.slice(0);
            _args.push(x);
            apply(runHasPropOfType, _args);
        })

;

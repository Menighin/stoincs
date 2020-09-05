Array.prototype.any = function(predicate) {
    if (predicate)
        return this.filter(predicate).length > 0;
    return this.length > 0;
};

Array.prototype.first = function(predicate) {
    if (predicate)
        return this.filter(predicate)[0];
    return this[0];
};

Array.prototype.last = function(predicate) {
    if (predicate)
        return this.filter(predicate)[this.length - 1];
    return this[this.length - 1];
};

Array.prototype.all = function(predicate) {
    if (predicate)
        return this.filter(predicate).length === this.length;
    return this.length > 0;
};

Array.prototype.dropFirst = function(predicate) {
    const result = [];
    let found = false;
    for (const v of this) {
        if (!found && (!predicate || predicate(v)))
            found = true;
        else
            result.push(v);
    }
    return result;
};

Array.prototype.dropLast = function(predicate) {
    const result = [];
    let found = false;
    const reversed = [...this].reverse();
    for (const v of reversed) {
        if (!found && (!predicate || predicate(v)))
            found = true;
        else
            result.push(v);
    }
    return result.reverse();
};

Array.prototype.distinct = function(predicate) {
    const unique = new Set();
    const predicateFn = predicate || ((o) => JSON.stringify(o));
    return this.filter(o => {
        const value = predicateFn(o);
        if (unique.has(value))
            return false;
        else {
            unique.add(value);
            return true;
        }
    });
};

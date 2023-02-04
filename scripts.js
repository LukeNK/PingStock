class Stock {
    constructor(name, url) {
        this.name = name;
        this.url = url;
    }
    getValue() {
        let cur = new Date(); // time before ping
        fetch(this.url).then(res => res.text)
        .then(_ => new Date() - cur) // time after ping
        
    }
}


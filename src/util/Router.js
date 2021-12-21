

module.exports = class Middleware {
    constructor(client, options = {}) {
        this.client = client
        this.name = options.name || false
    
    }

    async run(req, res) {
        throw new Error('Definir o método run.')
    }

}
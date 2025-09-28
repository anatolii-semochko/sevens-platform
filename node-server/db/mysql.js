const mysql = require('mysql2/promise')

class Database {
    constructor() {
        this.pool = null
        this.createPool()
    }

    createPool() {
        let password
        try {
            if (process.env.MYSQL_PASSWORD_FILE) {
                const fs = require('fs')
                password = fs.readFileSync(process.env.MYSQL_PASSWORD_FILE, 'utf8').trim()
            } else {
                password = process.env.MYSQL_PASSWORD || ''
            }
        } catch (error) {
            console.error('Error reading MySQL password:', error)
            password = ''
        }

        this.pool = mysql.createPool({
            host: 'mysql',
            port: 3306,
            user: 'app',
            password: password,
            database: 'sevens-time',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            acquireTimeout: 60000,
            timeout: 60000,
            reconnect: true,
        })

        console.log('MySQL connection pool created')
    }

    async query(sql, params = []) {
        try {
            const [rows] = await this.pool.execute(sql, params)
            return rows
        } catch (error) {
            console.error('Database query error:', error)
            throw error
        }
    }

    async findOne(table, conditions = {}, fields = '*') {
        const whereClause = Object.keys(conditions).length > 0
            ? 'WHERE ' + Object.keys(conditions).map(key => `${key} = ?`).join(' AND ')
            : ''

        const sql = `SELECT ${fields} FROM ${table} ${whereClause} LIMIT 1`
        const values = Object.values(conditions)

        const rows = await this.query(sql, values)
        return rows.length > 0 ? rows[0] : null
    }

    async findAll(table, conditions = {}, fields = '*', orderBy = null, limit = null) {
        const whereClause = Object.keys(conditions).length > 0
            ? 'WHERE ' + Object.keys(conditions).map(key => `${key} = ?`).join(' AND ')
            : ''

        const orderClause = orderBy ? `ORDER BY ${orderBy}` : ''
        const limitClause = limit ? `LIMIT ${limit}` : ''

        const sql = `SELECT ${fields} FROM ${table} ${whereClause} ${orderClause} ${limitClause}`.trim()
        const values = Object.values(conditions)

        return await this.query(sql, values)
    }

    async insert(table, data) {
        const fields = Object.keys(data).join(', ')
        const placeholders = Object.keys(data).map(() => '?').join(', ')
        const values = Object.values(data)

        const sql = `INSERT INTO ${table} (${fields}) VALUES (${placeholders})`
        const result = await this.query(sql, values)

        return result.insertId
    }

    async update(table, data, conditions) {
        const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ')
        const whereClause = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ')

        const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`
        const values = [...Object.values(data), ...Object.values(conditions)]

        const result = await this.query(sql, values)
        return result.affectedRows
    }

    async delete(table, conditions) {
        const whereClause = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ')

        const sql = `DELETE FROM ${table} WHERE ${whereClause}`
        const values = Object.values(conditions)

        const result = await this.query(sql, values)
        return result.affectedRows
    }

    async healthCheck() {
        try {
            await this.query('SELECT 1')
            return { connected: true, message: 'MySQL connection successful' }
        } catch (error) {
            return { connected: false, error: error.message }
        }
    }

    async close() {
        if (this.pool) {
            await this.pool.end()
            console.log('MySQL connection pool closed')
        }
    }
}

module.exports = new Database()

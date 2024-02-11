import * as Table from 'cli-table3';
import * as readline from "readline";
import * as crypto from 'crypto';

class Key {
    private readonly key: Buffer;

    constructor() {
        this.key = crypto.randomBytes(32);
    }

    public hmac(move: string) {
        return crypto.createHmac('sha3-256', this.key).update(move).digest('hex');
    }

    public getKey(): Buffer {
        return this.key;
    }
}

class Rules {
    public determine(choice: number, opponent: number, choicesLength: number): 'Win' | 'Lose' | 'Draw' {
        const half = Math.floor(choicesLength / 2);
        const result = Math.sign((opponent - choice + half + choicesLength) % choicesLength - half);

        return result === 0 ? "Draw" : result === 1 ? "Win" : "Lose";
    }
}

class TableGenerator {
    private readonly choices: string[];
    private rules: Rules;
    private readonly table: string[][];

    constructor(choices: string[]) {
        this.choices = choices;
        this.rules = new Rules();
        this.table = this.createTable();
    }

    private createTable(): string[][] {
        const table: string[][] = [['PC\\User➡', ...this.choices]];

        for(let i = 0; i < this.choices.length; i++) {
            const row = [this.choices[i]];
            for (let j = 0; j < this.choices.length; j++) {
                const result = this.rules.determine(i+1, j+1, this.choices.length);
                row.push(result);
            }
            table.push(row);
        }

        return table;
    }

    public generateTable(): any {
        const generatedTable = new Table({
            head: this.table[0],
            colWidths: new Array(this.choices.length + 1).fill(10),
            style: {
                head: ['red'],
                border: ['cyan'],
            }
        });

        for (let i = 1; i < this.table.length; i++) {
            generatedTable.push(this.table[i]);
        }

        return generatedTable;
    }
}

class Game {
    private readonly choices: string[];
    private readonly pcChoice: number;
    private tableGenerator: TableGenerator;
    private key: Key;
    private rules: Rules;

    constructor(choices: string[]) {
        this.choices = choices;
        this.pcChoice = Math.floor(Math.random() * this.choices.length);
        this.tableGenerator = new TableGenerator(this.choices);
        this.key = new Key();
        this.rules = new Rules();
    }

    private checkCondition(condition: boolean, errorMessage: string): void {
        if(condition) {
            console.error(errorMessage);
            process.exit(1);
        }
    }

    private validateArgs(): void {
        this.checkCondition(this.choices.length === 0, 'Please provide at least 3 or more odd arguments. Example: node script.js Rock Paper Scissors');
        this.checkCondition(this.choices.length < 3, 'Not enough arguments. Please provide at least 3 or more odd arguments.');
        this.checkCondition(this.choices.length % 2 === 0, 'Please provide an odd number of arguments which is greater than 3.');
        this.checkCondition(this.choices.some((arg, index) => this.choices.findIndex(a => a.toLowerCase() === arg.toLowerCase()) !== index), 'Please provide unique arguments.');
    }

    private showMenu(rl: readline.Interface): void {
        const pcHmac = this.key.hmac(this.choices[this.pcChoice]);

        const menu = `HMAC: ${pcHmac}\nAvailable moves:\n${this.choices.map((choice, index) => `${index + 1}. ${choice} `).join('\n')}\n? - help\n0. Quit\nEnter your move: `
        rl.question(menu, (answer) => {
            switch(answer) {
                case '?':
                    console.log('--------------------\n' + this.tableGenerator.generateTable().toString() + '\n--------------------');
                    this.showMenu(rl);
                    break;
                case '0':
                    console.log('--------------------\nGoodbye!\n--------------------')
                    rl.close();
                    break;
                default:
                    this.handleMove(answer, rl);
                    break;
            }
        })
    }

    private handleMove(answer: string, rl: readline.Interface): void {
        if(!Number.isInteger(+answer) || +answer < 1 || +answer > this.choices.length) {
            console.error('--------------------\nInvalid input. Please try again.\n--------------------');
            this.showMenu(rl);
            return;
        }

        const userChoice = +answer;
        const pcChoice = this.choices[this.pcChoice];
        const result = this.rules.determine(this.pcChoice + 1, userChoice, this.choices.length);

        console.log(`--------------------\nYour move: ${this.choices[userChoice - 1]}\nComputer move: ${pcChoice}\nYou ${result}\nHMAC key: ${this.key.getKey().toString('hex')}\n--------------------`);

        rl.close();
    }

    public play(): void {
        this.validateArgs();
        console.clear();
        const rl: readline.Interface = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        })
        this.showMenu(rl);
    }
}

const args = process.argv.slice(2);
const game = new Game(args);
game.play();
import * as Table from 'cli-table3';
import * as readline from "readline";
import * as crypto from 'crypto';

class Game {
    private choices: string[];
    private key: Buffer;
    private pcChoice: number;
    private table: string[][];
    private generatedTable: any;

    constructor(choices: string[]) {
        this.choices = choices;
        this.key = crypto.randomBytes(32);
        this.pcChoice = Math.floor(Math.random() * this.choices.length);
        this.table = this.createTable();
        this.generatedTable;
    }

    private determine(choice: number, opponent: number): 'Win' | 'Lose' | 'Draw' {
        const half = Math.floor(this.choices.length / 2);
        const result = Math.sign((opponent - choice + half + this.choices.length) % this.choices.length - half);

        return result === 0 ? "Draw" : result === 1 ? "Win" : "Lose";
    }

    private createTable(): string[][] {
        const table: string[][] = [['PC\\User➡', ...this.choices]];

        for(let i = 0; i < this.choices.length; i++) {
            const row = [this.choices[i]];
            for (let j = 0; j < this.choices.length; j++) {
                const result = this.determine(i+1, j+1);
                row.push(result);
            }
            table.push(row);
        }

        this.generateTable(table);
        return table;
    }

    private generateTable(table: string[][]): void {
        this.generatedTable = new Table({
            head: table[0],
            colWidths: new Array(this.choices.length + 1).fill(10),
            style: {
                head: ['red'],
                border: ['cyan'],
            }
        });

        for (let i = 1; i < table.length; i++) {
            this.generatedTable.push(table[i]);
        }
    }

    private printTable(): void {
        console.log('--------------------\n'+this.generatedTable.toString()+'\n--------------------');
    }

    private hmac(move: string): string {
        return crypto.createHmac('sha3-256', this.key).update(move).digest('hex');
    }

    private validateArgs(): void {
        if(args.length === 0) {
            console.error('Please provide at least 3 or more odd arguments. Example: node script.js Rock Paper Scissors');
            process.exit(1)
        }
        if(args.length < 3) {
            console.error('Not enough arguments. Please provide at least 3 or more odd arguments.');
            process.exit(1)
        }
        if(args.length % 2 === 0) {
            console.error('Please provide an odd number of arguments which is greater than 3.');
            process.exit(1)
        }
        if(args.some((arg, index) => args.findIndex(a => a.toLowerCase() === arg.toLowerCase()) !== index)) {
            console.error('Please provide unique arguments.');
            process.exit(1)
        }
    }

    private showMenu(rl: readline.Interface): void {
        const pcHmac = this.hmac(this.choices[this.pcChoice]);

        const menu = `HMAC: ${pcHmac}\nAvailable moves:\n${this.choices.map((choice, index) => `${index + 1}. ${choice} `).join('\n')}\n? - help\n0. Quit\nEnter your move: `
        rl.question(menu, (answer) => {
            switch(answer) {
                case '?':
                    this.printTable();
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
        const result = this.table[this.pcChoice+1][userChoice];

        console.log(`--------------------\nYour move: ${this.choices[userChoice - 1]}\nComputer move: ${pcChoice}\nYou ${result}\nHMAC key: ${this.key.toString('hex')}\n--------------------`);

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
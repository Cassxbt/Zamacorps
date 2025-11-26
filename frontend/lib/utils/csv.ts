import Papa from 'papaparse';

export interface CSVRow {
    address: string;
    salaryPerBlock: string;
    startBlock: string;
    cliffBlocks: string;
}

export interface ParsedEmployee {
    address: string;
    salaryPerBlock: bigint;
    startBlock: bigint;
    cliffBlocks: bigint;
    errors: string[];
}

/**
 * Validate Ethereum address (basic checksum validation)
 */
export function isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Parse and validate CSV data for bulk employee upload
 */
export async function parseEmployeeCSV(file: File): Promise<{
    employees: ParsedEmployee[];
    errors: string[];
}> {
    return new Promise((resolve) => {
        const globalErrors: string[] = [];
        const employees: ParsedEmployee[] = [];

        Papa.parse<CSVRow>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                // Validate headers
                const requiredHeaders = ['address', 'salaryPerBlock', 'startBlock', 'cliffBlocks'];
                const headers = results.meta.fields || [];
                const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

                if (missingHeaders.length > 0) {
                    globalErrors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
                }

                // Parse and validate each row
                results.data.forEach((row, index) => {
                    const rowErrors: string[] = [];
                    const rowNum = index + 2; // +2 for 1-indexed and header row

                    // Validate address
                    if (!row.address || !isValidAddress(row.address)) {
                        rowErrors.push(`Row ${rowNum}: Invalid Ethereum address`);
                    }

                    // Validate salary
                    let salaryPerBlock = BigInt(0);
                    try {
                        const salary = parseFloat(row.salaryPerBlock);
                        if (isNaN(salary) || salary <= 0) {
                            rowErrors.push(`Row ${rowNum}: Invalid salary amount`);
                        } else {
                            salaryPerBlock = BigInt(Math.floor(salary * 1e18)); // Convert ETH to wei
                        }
                    } catch {
                        rowErrors.push(`Row ${rowNum}: Failed to parse salary`);
                    }

                    // Validate start block
                    let startBlock = BigInt(0);
                    if (row.startBlock === '' || row.startBlock === 'auto') {
                        startBlock = BigInt(0); // Will be set to current + 10 later
                    } else {
                        try {
                            const block = parseInt(row.startBlock);
                            if (isNaN(block) || block < 0) {
                                rowErrors.push(`Row ${rowNum}: Invalid start block`);
                            } else {
                                startBlock = BigInt(block);
                            }
                        } catch {
                            rowErrors.push(`Row ${rowNum}: Failed to parse start block`);
                        }
                    }

                    // Validate cliff blocks
                    let cliffBlocks = BigInt(0);
                    try {
                        const cliff = parseInt(row.cliffBlocks);
                        if (isNaN(cliff) || cliff < 0) {
                            rowErrors.push(`Row ${rowNum}: Invalid cliff period`);
                        } else {
                            cliffBlocks = BigInt(cliff);
                        }
                    } catch {
                        rowErrors.push(`Row ${rowNum}: Failed to parse cliff blocks`);
                    }

                    employees.push({
                        address: row.address,
                        salaryPerBlock,
                        startBlock,
                        cliffBlocks,
                        errors: rowErrors,
                    });
                });

                resolve({
                    employees,
                    errors: globalErrors,
                });
            },
            error: (error) => {
                globalErrors.push(`CSV parse error: ${error.message}`);
                resolve({
                    employees: [],
                    errors: globalErrors,
                });
            },
        });
    });
}

/**
 * Generate sample CSV content for download
 */
export function generateSampleCSV(): string {
    return `address,salaryPerBlock,startBlock,cliffBlocks
0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb,0.001,auto,100
0x5aeda56215b167893e80b4fe645ba6d5bab767de,0.002,1000,200
0x1234567890123456789012345678901234567890,0.0015,auto,150`;
}

/**
 * Download CSV file
 */
export function downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

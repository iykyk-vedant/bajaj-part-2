'use server';

import {
    getConsolidatedDataEntries as getEntries,
    saveConsolidatedDataEntry,
    updateConsolidatedDataEntry,
    updateConsolidatedDataEntryByProductSrNo,
    deleteConsolidatedDataEntry,
    getNextSrNoForPartcode,
    searchConsolidatedDataEntriesByPcb as searchByPcb
} from '@/lib/pg-db';
import { validateConsumption, formatValidatedComponents } from '@/lib/consumption-validation-service';

function formatDateForDb(dateString: string | undefined | null): string | null {
    if (!dateString) return null;
    
    // Check if date is in DD/MM/YYYY format
    const ddMmYyyyMatch = dateString.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (ddMmYyyyMatch) {
        const [_, day, month, year] = ddMmYyyyMatch;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return dateString;
}

export async function validateBomComponents(analysisText: string, partCode?: string) {
    try {
        const result = await validateConsumption(analysisText, partCode);
        return {
            success: true,
            data: {
                isValid: result.isValid,
                formattedComponents: formatValidatedComponents(result.validatedComponents),
                errorMessage: result.errorMessage
            }
        };
    } catch (error) {
        console.error('Error validating BOM components:', error);
        return { success: false, error: 'Failed to validate components' };
    }
}

export async function getConsolidatedDataEntries(pageNum?: number, pageSize?: number) {
    try {
        const { rows, totalRows } = await getEntries(pageNum, pageSize);
        return {
            success: true,
            data: rows,
            pagination: pageNum && pageSize ? {
                currentPage: pageNum,
                pageSize,
                totalRows,
                hasMore: pageNum * pageSize < totalRows
            } : undefined
        };
    } catch (error) {
        console.error('Error fetching consolidated data:', error);
        return { success: false, error: 'Failed to fetch entries' };
    }
}

export async function saveConsolidatedData(data: any, sessionDc?: string, sessionPartCode?: string) {
    try {
        // Map camcelCase to snake_case if necessary, or assume pg-db handles it
        // Based on usages, we might need to map keys
        const dbData = {
            sr_no: data.srNo,
            dc_no: data.dcNo || sessionDc,
            branch: data.branch,
            bccd_name: data.bccdName,
            product_description: data.productDescription,
            product_sr_no: data.productSrNo,
            date_of_purchase: formatDateForDb(data.dateOfPurchase),
            complaint_no: data.complaintNo,
            part_code: data.partCode || sessionPartCode,
            nature_of_defect: data.natureOfDefect || data.defect,
            visiting_tech_name: data.visitingTechName,
            mfg_month_year: data.mfgMonthYear,
            pcb_sr_no: data.pcbSrNo,
            repair_date: formatDateForDb(data.repairDate),
            testing: data.testing,
            failure: data.failure,
            status: data.status,
            analysis: data.analysis,
            component_change: data.componentChange,
            engg_name: data.enggName,
            dispatch_date: formatDateForDb(data.dispatchDate),
            tag_entry_by: data.tagEntryBy,
            consumption_entry_by: data.consumptionEntryBy,
            validation_result: data.validationResult,
            remarks: data.remarks
        };

        const entry = await saveConsolidatedDataEntry(dbData);
        return { success: true, data: entry };
    } catch (error) {
        console.error('Error saving consolidated data:', error);
        return { success: false, error: 'Failed to save entry' };
    }
}

export async function updateConsolidatedDataEntryAction(id: string, data: any) {
    try {
        const dbData: any = {};
        // Map keys to snake_case
        if (data.srNo) dbData.sr_no = data.srNo;
        if (data.dcNo) dbData.dc_no = data.dcNo;
        if (data.branch) dbData.branch = data.branch;
        if (data.bccdName) dbData.bccd_name = data.bccdName;
        if (data.productDescription) dbData.product_description = data.productDescription;
        if (data.productSrNo) dbData.product_sr_no = data.productSrNo;
        if (data.dateOfPurchase) dbData.date_of_purchase = formatDateForDb(data.dateOfPurchase);
        if (data.complaintNo) dbData.complaint_no = data.complaintNo;
        if (data.partCode) dbData.part_code = data.partCode;
        if (data.natureOfDefect || data.defect) dbData.nature_of_defect = data.natureOfDefect || data.defect;
        if (data.visitingTechName) dbData.visiting_tech_name = data.visitingTechName;
        if (data.mfgMonthYear) dbData.mfg_month_year = data.mfgMonthYear;
        if (data.pcbSrNo) dbData.pcb_sr_no = data.pcbSrNo;
        if (data.repairDate !== undefined) dbData.repair_date = formatDateForDb(data.repairDate);
        if (data.testing !== undefined) dbData.testing = data.testing;
        if (data.failure !== undefined) dbData.failure = data.failure;
        if (data.status !== undefined) dbData.status = data.status;
        if (data.analysis !== undefined) dbData.analysis = data.analysis;
        if (data.componentChange !== undefined) dbData.component_change = data.componentChange;
        if (data.enggName !== undefined) dbData.engg_name = data.enggName;
        if (data.dispatchDate !== undefined) dbData.dispatch_date = formatDateForDb(data.dispatchDate);
        if (data.validationResult !== undefined) dbData.validation_result = data.validationResult;
        if (data.remarks !== undefined) dbData.remarks = data.remarks;

        const entry = await updateConsolidatedDataEntry(id, dbData);
        return { success: true, data: entry };
    } catch (error) {
        console.error('Error updating consolidated data:', error);
        return { success: false, error: 'Failed to update entry' };
    }
}

export async function updateConsolidatedDataEntryByProductSrNoAction(productSrNo: string, data: any) {
    try {
        const dbData: any = {};
        if (data.repairDate !== undefined) dbData.repair_date = formatDateForDb(data.repairDate);
        if (data.testing !== undefined) dbData.testing = data.testing;
        if (data.failure !== undefined) dbData.failure = data.failure;
        if (data.status !== undefined) dbData.status = data.status;
        if (data.analysis !== undefined) dbData.analysis = data.analysis;
        if (data.componentChange !== undefined) dbData.component_change = data.componentChange;
        if (data.enggName !== undefined) dbData.engg_name = data.enggName;
        if (data.dispatchDate !== undefined) dbData.dispatch_date = formatDateForDb(data.dispatchDate);
        if (data.validationResult !== undefined) dbData.validation_result = data.validationResult;
        if (data.remarks !== undefined) dbData.remarks = data.remarks;
        if (data.consumptionEntryBy) dbData.consumption_entry_by = data.consumptionEntryBy;

        const entry = await updateConsolidatedDataEntryByProductSrNo(productSrNo, dbData);
        return { success: true, data: entry };
    } catch (error) {
        console.error('Error updating consolidated data by product sr no:', error);
        return { success: false, error: 'Failed to update entry' };
    }
}

export async function deleteConsolidatedDataEntryAction(id: string) {
    try {
        await deleteConsolidatedDataEntry(id);
        return { success: true };
    } catch (error) {
        console.error('Error deleting consolidated data:', error);
        return { success: false, error: 'Failed to delete entry' };
    }
}

export async function getNextSrNoForPartcodeAction(partCode: string) {
    try {
        const nextSrNo = await getNextSrNoForPartcode(partCode);
        return { success: true, data: nextSrNo };
    } catch (error) {
        console.error('Error getting next SR No:', error);
        return { success: false, error: 'Failed to generate next SR No' };
    }
}

export async function searchConsolidatedDataEntriesByPcb(query: string, partCode: string, pcbSrNo: string, mfgMonthYear?: string, srNo?: string) {
    try {
        const entries = await searchByPcb(query, partCode, pcbSrNo, mfgMonthYear, srNo);
        return { success: true, data: entries };
    } catch (error) {
        console.error('Error searching by PCB:', error);
        return { success: false, error: 'Failed to search entries' };
    }
}

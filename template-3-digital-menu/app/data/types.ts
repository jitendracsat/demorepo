export interface MenuItem {
    title: string;
    price: string;
    time?: string;
    tag?: string;
    desc: string;
    img: string;
    isVeg?: boolean;
    isNonVeg?: boolean;
    isAlcoholic?: boolean;
    category: string;
    gst_details?: {
        cgst: number;
        sgst: number;
        igst?: number;
        inclusive?: boolean;
    };
}

import { format } from "date-fns";
import { es } from "date-fns/locale";
console.log(format(new Date(), "EEEE dd MMMM", { locale: es }));

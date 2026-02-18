import { getData } from "@/api";
import { ICategoryDetailsType } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

const getCategories = async () => {
  const { data } = await getData<ICategoryDetailsType[]>(`/categories`);
  return data?.data;
};

const useCategory = () => {
  const query = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });
  return query;
};

export default useCategory;

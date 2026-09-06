import { getData } from "@/api";
import {
  getCustomCategories,
  subscribeToCustomOptions,
} from "@/lib/custom-event-options";
import { ICategoryDetailsType } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

const getCategories = async () => {
  const { data } = await getData<ICategoryDetailsType[]>(`/categories`);
  return data?.data;
};

const useCategory = () => {
  const [customCategories, setCustomCategories] = useState<ICategoryDetailsType[]>([]);

  useEffect(() => {
    const sync = () => setCustomCategories(getCustomCategories());
    sync();
    return subscribeToCustomOptions(sync);
  }, []);

  const query = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    retry: 0,
  });
  return {
    ...query,
    data: [...customCategories, ...(query.data ?? [])].filter(
      (category, index, list) =>
        list.findIndex(
          (item) => item.name.toLowerCase() === category.name.toLowerCase(),
        ) === index,
    ),
  };
};

export default useCategory;

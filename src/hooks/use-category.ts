import { getData } from "@/api";
import {
  getCustomCategories,
  subscribeToCustomOptions,
} from "@/lib/custom-event-options";
import { ICategoryDetailsType } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

const mockCategories: ICategoryDetailsType[] = [
  { id: "mock-category-concerts", name: "Concerts & Gigs" },
  { id: "mock-category-festivals", name: "Festivals & Lifestyle" },
  { id: "mock-category-business", name: "Business & Networking" },
  { id: "mock-category-food", name: "Food & Drinks" },
  { id: "mock-category-performing-arts", name: "Performing Arts" },
  { id: "mock-category-sports", name: "Sports & Outdoors" },
];

const getCategories = async () => {
  if (process.env.NODE_ENV === "development") {
    return mockCategories;
  }

  try {
    const { data } = await getData<ICategoryDetailsType[]>(`/categories`);
    return data?.data;
  } catch (error) {
    throw error;
  }
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

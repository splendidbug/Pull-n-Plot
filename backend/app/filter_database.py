import os
import pandas as pd
from flask import current_app
from rapidfuzz import fuzz
from app import db
from app.models import CombinedFilteredData
import pandas.api.types as ptypes


def fuzzy_match(row_value, queries, threshold=80):
    row_value_lower = row_value.lower()
    return any(fuzz.ratio(row_value_lower, q) >= threshold for q in queries)


def add_merged_data_to_db(task_id, merged_df):
    col_type_dict = {
        col: ptypes.is_categorical_dtype(
            merged_df[col]) or ptypes.is_object_dtype(merged_df[col])
        for col in merged_df.columns
    }
    for row_number, row in merged_df.iterrows():
        for col_name, value in row.items():
            record = CombinedFilteredData(
                task_id=task_id,
                row_id=row_number,
                is_categorical=col_type_dict[col_name],
                column_name=col_name,
                column_value=value
            )
            db.session.add(record)

    db.session.commit()


def join_dfs(all_filtered_data):
    common_cols = set.intersection(*(set(df.columns)
                                   for df in all_filtered_data.values()))
    common_cols = list(common_cols)

    # Perform full outer join sequentially
    from functools import reduce

    merged_df = reduce(
        lambda left, right: pd.merge(left, right, on=common_cols, how='outer'),
        all_filtered_data.values()
    )
    return merged_df


def apply_filters(task_id, data_sources, task_filters):
    data_dir = os.path.join(current_app.root_path, '..', 'sample_data')

    all_filtered_data = {}

    for ds in data_sources:
        source_name = ds["selectedSource"]
        selected_fields = ds.get("selectedFields", [])

        print("task_filters: ", task_filters)
        file_path = os.path.join(data_dir, source_name)

        if not os.path.exists(file_path):
            print(f"File not found: {file_path}")
            continue

        # Load the file into a DataFrame
        df = pd.read_csv(file_path)

        # filter columns
        filtered_df = df[selected_fields] if selected_fields else df

        filters = next(
            (item['fieldFilters']
             for item in task_filters if item['source'] == source_name),
            None  # default if not found
        )
        if filters:
            for field, condition in filters.items():
                # Handle numeric range filter
                if "from" in condition or "to" in condition:
                    filtered_df[field] = pd.to_numeric(
                        filtered_df[field], errors="coerce")

                    from_val = condition.get("from")
                    to_val = condition.get("to")

                    if from_val not in [None, ""]:
                        filtered_df = filtered_df[filtered_df[field] >= float(
                            from_val)]
                    if to_val not in [None, ""]:
                        filtered_df = filtered_df[filtered_df[field] <= float(
                            to_val)]

                # Handle categorical values filter - do fuzzy matching
                elif "values" in condition:
                    query_values = [val.lower() for val in condition['values']]
                    filtered_df = filtered_df[filtered_df[field].apply(
                        lambda x: fuzzy_match(x, query_values))]

        all_filtered_data[source_name] = filtered_df

    print(df)
    print(all_filtered_data)
    merged_df = join_dfs(all_filtered_data)
    print("merged data")
    print(merged_df)
    add_merged_data_to_db(task_id, merged_df)
    print("added to db")
    return all_filtered_data
